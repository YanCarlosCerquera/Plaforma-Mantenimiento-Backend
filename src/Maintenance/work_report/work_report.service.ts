import { Injectable, Logger } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import type { Model } from "mongoose"
import { WorkReport } from "./entities/work_report.entity"
import type { CreateWorkReportDto } from "./dto/create-work_report.dto"
import type { UpdateWorkReportDto } from "./dto/update-work_report.dto"
import { GenericService } from "src/Generic/generic.service"
import { MaintenanceRequest } from "../application-maintenance/entities/application-maintenance.entity"
import { OrdenesTrabajo } from "../word_orden/entities/word_orden.entity"
import { User } from "src/users/entities/user.entity"
import { Assets } from "../assets/entities/asset.entity"
import { Environment } from "src/environments/entities/environment.entity"
import { WorkReportPdfService } from "./pdf/work-report-pdf.service"
import { NotificationService } from "../application-maintenance/services/notification.service"
import { Response } from "express-serve-static-core";

@Injectable()
export class WorkReportService extends GenericService<WorkReport, CreateWorkReportDto, UpdateWorkReportDto> {
  private readonly logger = new Logger(WorkReportService.name);

  constructor(
    @InjectModel(WorkReport.name) private workReportModel: Model<WorkReport>,
    @InjectModel(OrdenesTrabajo.name) private OrdenModel: Model<OrdenesTrabajo>,
    @InjectModel(MaintenanceRequest.name) private readonly maintenanceModel: Model<MaintenanceRequest>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Assets.name) private readonly assetModel: Model<Assets>,
    @InjectModel(Environment.name) private readonly environmentModel: Model<Environment>,
    private readonly workReportPdfService: WorkReportPdfService,
    private readonly notificationService: NotificationService
  ) {
    super(workReportModel);
  }

  /**
   * Sobrescribe el método create para enviar notificaciones
   * @param createDto Datos para crear el informe
   * @returns El informe creado
   */
  async create(createDto: CreateWorkReportDto): Promise<WorkReport> {
    // Crear el informe usando el método de la clase padre
    const createdReport = await super.create(createDto)

    // Enviar notificación al instructor responsable del ambiente
    await this.sendReportNotificationToEnvironmentInstructor(createdReport._id.toString())

    return createdReport
  }

  /**
   * Sobrescribe el método update para enviar notificaciones si se completa el informe
   * @param id ID del informe
   * @param updateDto Datos para actualizar
   * @returns El informe actualizado
   */
  async update(id: string, updateDto: UpdateWorkReportDto): Promise<WorkReport> {
    // Obtener el informe antes de actualizarlo
    const oldReport = await this.workReportModel.findById(id).exec()

    // Actualizar el informe usando el método de la clase padre
    const updatedReport = await super.update(id, updateDto)

    // Si el informe se ha completado (por ejemplo, si se ha añadido workDone o se ha cambiado el estado)
    // y antes no estaba completo, enviar notificación
    if ((updateDto.workDone && !oldReport.workDone) || (updateDto.status === true && oldReport.status === false)) {
      await this.sendReportNotificationToEnvironmentInstructor(id)
    }

    return updatedReport
  }

  /**
   * Envía una notificación con el informe PDF al instructor responsable del ambiente donde está el activo
   * @param reportId ID del informe de trabajo
   */
  async sendReportNotificationToEnvironmentInstructor(reportId: string): Promise<void> {
    try {
      this.logger.log(`Iniciando envío de notificación para el informe ${reportId}`)

      // Obtener el informe
      const workReport = await this.workReportModel.findById(reportId).exec()
      if (!workReport) {
        this.logger.warn(`No se encontró el informe con ID ${reportId}`)
        return
      }

      // Obtener la orden de trabajo
      const orden = await this.OrdenModel.findById(workReport.orderId)
        .populate("tecnicoId", "name email")
        .populate("solicitud")
        .exec()

      if (!orden) {
        this.logger.warn(`No se encontró la orden de trabajo asociada al informe ${reportId}`)
        return
      }

      // Obtener información del activo
      const solicitud = orden.solicitud
      const asset = await this.assetModel.findOne({ serialNumber: solicitud.serialNumber }).exec()

      if (!asset) {
        this.logger.warn(`No se encontró el activo con número de serie ${solicitud.serialNumber}`)
        return
      }

      // Obtener el ambiente donde está el activo
      const environment = await this.environmentModel.findById(asset.environmentId).exec()

      if (!environment) {
        this.logger.warn(`No se encontró el ambiente asociado al activo ${asset._id}`)
        return
      }

      // Obtener el instructor responsable del ambiente
      const responsibleInstructor = await this.userModel.findById(environment.responsibleUser).exec()

      if (!responsibleInstructor) {
        this.logger.warn(`No se encontró el instructor responsable del ambiente ${environment._id}`)
        return
      }

      // Verificar que el instructor tenga email
      if (!responsibleInstructor.email) {
        this.logger.warn(`El instructor responsable ${responsibleInstructor._id} no tiene email registrado`)
        return
      }

      const assetInfo = asset ? `${asset.name} ${asset.brand} ${asset.modelo}` : "No disponible"

      // Generar el PDF como buffer
      const pdfBuffer = await this.workReportPdfService.generateReportPDFBuffer(reportId)

      // Preparar el correo
      const tecnico = orden.tecnicoId

      // Enviar el correo con el PDF adjunto
      await this.notificationService.sendEmailWithAttachment({
        to: responsibleInstructor.email,
        subject: `Informe de Mantenimiento Completado - Activo en su Ambiente - Radicado ${orden.radicado}`,
        body: `
<h2>Informe de Mantenimiento Completado</h2>

<p>Estimado/a Instructor/a ${responsibleInstructor.name},</p>

<p>Le informamos que el técnico ${tecnico ? tecnico.name : "asignado"} ha completado el informe de mantenimiento para un activo ubicado en su ambiente "${environment.name}".</p>

<p><strong>Detalles del informe:</strong></p>
<ul>
  <li><strong>Radicado:</strong> ${orden.radicado}</li>
  <li><strong>Activo:</strong> ${assetInfo}</li>
  <li><strong>Ambiente:</strong> ${environment.name} (${environment.code})</li>
  <li><strong>Trabajo realizado:</strong> ${workReport.workDone || "No especificado"}</li>
  <li><strong>Horas empleadas:</strong> ${workReport.hours || 0}</li>
  <li><strong>Costos:</strong> $${workReport.costs ? workReport.costs.toLocaleString("es-CO") : "0"}</li>
</ul>

<p>Adjunto encontrará el informe completo en formato PDF.</p>

<p>Gracias por su atención.</p>

<hr>
<p><em>Este es un mensaje automático, por favor no responda a este correo.</em></p>
        `,
        attachments: [
          {
            filename: `informe-mantenimiento-${orden.radicado}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      })

      this.logger.log(
        `Notificación con informe PDF enviada exitosamente al instructor responsable del ambiente ${responsibleInstructor.name} (${responsibleInstructor.email})`,
      )
    } catch (error) {
      this.logger.error(`Error al enviar notificación con informe PDF: ${error.message}`, error.stack)
    }
  }

  async findAllDetails(tecnicoId?: string, instructorId?: string): Promise<WorkReport[]> {
    // Obtener todos los WorkReport con el populate
    const workReports = await this.workReportModel
      .find()
      .populate({
        path: "orderId",
        select: "radicado state",
        populate: [
          {
            path: "solicitud",
            select: "InventoryCode",
          },
          {
            path: "tecnicoId",
            select: "name",
          },
          {
            path: "instructorId",
            select: "name",
          },
        ],
      })
      .exec()

    return workReports.filter((workReport) => {
      const order = workReport.orderId

      if (!order) {
        return false
      }

      if (tecnicoId && order.tecnicoId?._id.toString() !== tecnicoId) {
        return false
      }

      if (instructorId && order.instructorId?._id.toString() !== instructorId) {
        return false
      }

      return true
    })
  }

  async findOne(id: string): Promise<WorkReport> {
    return await this.workReportModel
      .findById(id)
      .populate({
        path: "orderId",
        select: "radicado state",
      })
      .exec()
  }

  async obtenerInformesConDetalles(): Promise<any[]> {
    const informes = await this.workReportModel
      .find({ orderId: { $exists: true, $ne: null } }) // Evita IDs nulos
      .populate({
        path: "orderId",
        populate: [
          {
            path: "solicitud",
            model: "MaintenanceRequest",
            select: "InventoryCode",
          },
          {
            path: "tecnicoId",
            model: "User",
            select: "name",
          },
        ],
      })
      .select("Informe costs hours workDone orderId")
      .lean()

    return informes.map((informe) => ({
      Informe: informe.Informe,
      Id: informe._id,
      CodigoInventario: informe.orderId?.solicitud ? (informe.orderId.solicitud as any).InventoryCode : null,
      Horas: informe.hours,
      Costos: informe.costs,
      TrabajoRealizado: informe.workDone,
      EjecutadoPor: informe.orderId?.tecnicoId?.name || null,
    }))
  }

  async maintenanceHistory(serialNumber: string) {
    const workReports = await this.workReportModel
      .find()
      .populate({
        path: "orderId",
        select: "radicado solicitud",
        match: { state: true },
        populate: {
          path: "solicitud",
          select: "serialNumber maintenanceType",
          model: "MaintenanceRequest",
        },
      })
      .sort({ createdAt: -1 })
      .exec()

    const filteredReports = workReports.filter(
      (workReport) => workReport.orderId?.solicitud && workReport.orderId.solicitud.serialNumber === serialNumber,
    )

    return filteredReports
  }

  /**
   * Genera un informe PDF para un reporte de trabajo específico
   * @param id ID del informe de trabajo
   * @param res Objeto Response de Express para enviar el PDF
   */
  async generateReportPDF(id: string, res: Response): Promise<void> {
    return this.workReportPdfService.generateReportPDF(id, res)
  }
}

