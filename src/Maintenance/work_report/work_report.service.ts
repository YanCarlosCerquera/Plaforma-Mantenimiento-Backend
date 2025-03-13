import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import type { Model } from "mongoose"
import { WorkReport } from "./entities/work_report.entity"
import type { CreateWorkReportDto } from "./dto/create-work_report.dto"
import type { UpdateWorkReportDto } from "./dto/update-work_report.dto"
import { GenericService } from "src/Generic/generic.service"
import { MaintenanceRequest } from "../application-maintenance/entities/application-maintenance.entity"
import type { Response } from "express"
import { WorkReportPdfService } from "./pdf/work-report-pdf.service"

@Injectable()
export class WorkReportService extends GenericService<WorkReport, CreateWorkReportDto, UpdateWorkReportDto> {
  constructor(
    @InjectModel(WorkReport.name) private workReportModel: Model<WorkReport>,
    @InjectModel(MaintenanceRequest.name) private readonly maintenanceModel: Model<MaintenanceRequest>,
    private readonly workReportPdfService: WorkReportPdfService
  ) {
    super(workReportModel);
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

