import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import type { Model } from "mongoose"
import { WorkReport } from "../entities/work_report.entity"
import { OrdenesTrabajo } from "../../word_orden/entities/word_orden.entity"
import { MaintenanceRequest } from "../../application-maintenance/entities/application-maintenance.entity"
import type { Response } from "express"
import * as PDFDocument from "pdfkit"
import { Assets } from "src/maintenance/assets/entities/asset.entity"
import { User } from "src/users/entities/user.entity"
import type PDFKit from "pdfkit"

@Injectable()
export class WorkReportPdfService {
  private readonly logger = new Logger(WorkReportPdfService.name);

  constructor(
    @InjectModel(WorkReport.name) private workReportModel: Model<WorkReport>,
    @InjectModel(OrdenesTrabajo.name) private ordenModel: Model<OrdenesTrabajo>,
    @InjectModel(MaintenanceRequest.name) private maintenanceModel: Model<MaintenanceRequest>,
    @InjectModel(Assets.name) private assetModel: Model<Assets>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Genera un informe PDF para un reporte de trabajo específico
   * @param id ID del informe de trabajo
   * @param res Objeto Response de Express para enviar el PDF
   */
  async generateReportPDF(id: string, res: Response): Promise<void> {
    try {
      // Obtener el informe con todos los datos relacionados
      const workReport = await this.workReportModel.findById(id).exec()
      if (!workReport) {
        throw new NotFoundException(`Informe de trabajo con ID ${id} no encontrado`)
      }

      // Obtener la orden de trabajo relacionada
      const orden = await this.ordenModel
        .findById(workReport.orderId)
        .populate("tecnicoId", "name email phone")
        .populate("instructorId", "name email phone")
        .exec()

      if (!orden) {
        throw new NotFoundException(`Orden de trabajo relacionada no encontrada`)
      }

      // Obtener la solicitud de mantenimiento
      const solicitud = await this.maintenanceModel.findById(orden.solicitud).exec()
      if (!solicitud) {
        throw new NotFoundException(`Solicitud de mantenimiento relacionada no encontrada`)
      }

      // Obtener información del activo
      const asset = await this.assetModel.findOne({ serialNumber: solicitud.serialNumber }).exec()

      // Crear el documento PDF
      const doc = new PDFDocument({ margin: 50 })

      // Configurar la respuesta HTTP
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename=informe-trabajo-${id}.pdf`)

      // Pipe el PDF a la respuesta
      doc.pipe(res)

      // Agregar contenido al PDF
      this.generatePdfContent(doc, workReport, orden, solicitud, asset)

      // Finalizar el documento
      doc.end()

      this.logger.log(`PDF generado exitosamente para el informe de trabajo ${id}`)
    } catch (error) {
      this.logger.error(`Error al generar PDF para el informe ${id}: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Genera un informe PDF y lo devuelve como Buffer
   * @param id ID del informe de trabajo
   * @returns Buffer con el contenido del PDF
   */
  async generateReportPDFBuffer(id: string): Promise<Buffer> {
    try {
      // Obtener el informe con todos los datos relacionados
      const workReport = await this.workReportModel.findById(id).exec()
      if (!workReport) {
        throw new NotFoundException(`Informe de trabajo con ID ${id} no encontrado`)
      }

      // Obtener la orden de trabajo relacionada
      const orden = await this.ordenModel
        .findById(workReport.orderId)
        .populate("tecnicoId", "name email phone")
        .populate("instructorId", "name email phone")
        .exec()

      if (!orden) {
        throw new NotFoundException(`Orden de trabajo relacionada no encontrada`)
      }

      // Obtener la solicitud de mantenimiento
      const solicitud = await this.maintenanceModel.findById(orden.solicitud).exec()
      if (!solicitud) {
        throw new NotFoundException(`Solicitud de mantenimiento relacionada no encontrada`)
      }

      // Obtener información del activo
      const asset = await this.assetModel.findOne({ serialNumber: solicitud.serialNumber }).exec()

      // Crear el documento PDF
      const doc = new PDFDocument({ margin: 50 })

      // Crear un buffer para almacenar el PDF
      const chunks: Buffer[] = []
      doc.on("data", (chunk) => chunks.push(chunk))

      // Crear una promesa que se resolverá cuando el PDF esté completo
      const pdfBuffer = new Promise<Buffer>((resolve, reject) => {
        doc.on("end", () => {
          const result = Buffer.concat(chunks)
          resolve(result)
        })
        doc.on("error", reject)
      })

      // Agregar contenido al PDF
      this.generatePdfContent(doc, workReport, orden, solicitud, asset)

      // Finalizar el documento
      doc.end()

      this.logger.log(`PDF generado exitosamente como buffer para el informe de trabajo ${id}`)

      // Esperar a que se complete el PDF y devolver el buffer
      return await pdfBuffer
    } catch (error) {
      this.logger.error(`Error al generar PDF buffer para el informe ${id}: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Genera el contenido del PDF
   * @param doc Documento PDF
   * @param workReport Informe de trabajo
   * @param orden Orden de trabajo
   * @param solicitud Solicitud de mantenimiento
   * @param asset Activo relacionado
   */
  private generatePdfContent(
    doc: PDFKit.PDFDocument,
    workReport: WorkReport,
    orden: any,
    solicitud: any,
    asset: any,
  ): void {
    // Título
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("INFORME DE TRABAJO DE MANTENIMIENTO", { align: "center" })
      .moveDown(0.5)

    // Información general
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("INFORMACIÓN GENERAL", { underline: true })
      .moveDown(0.5)
      .font("Helvetica")
      .text(`Número de Radicado: ${orden.radicado}`)
      .text(`Técnico Asignado: ${orden.tecnicoId ? orden.tecnicoId.name : "No asignado"}`)
      .text(`Instructor Responsable: ${orden.instructorId ? orden.instructorId.name : "No asignado"}`)
      .moveDown(1)

    // Información del activo
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("INFORMACIÓN DEL ACTIVO", { underline: true })
      .moveDown(0.5)
      .font("Helvetica")
      .text(`Número de Serie: ${solicitud.serialNumber}`)

    if (asset) {
      doc
        .text(`Nombre: ${asset.name || "No disponible"}`)
        .text(`Marca: ${asset.brand || "No disponible"}`)
        .text(`Modelo: ${asset.modelo || "No disponible"}`)
        .text(`Código de Inventario: ${asset.inventoryCode || "No disponible"}`)
    } else {
      doc.text("Información del activo no disponible")
    }

    doc.moveDown(1)

    // Detalles del trabajo realizado
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("DETALLES DEL TRABAJO REALIZADO", { underline: true })
      .moveDown(0.5)
      .font("Helvetica")
      .text(`Tipo de Mantenimiento: ${solicitud.maintenanceType || "No especificado"}`)
      .text(`Horas Empleadas: ${workReport.hours || 0}`)
      .text(`Costos: $${workReport.costs ? workReport.costs.toLocaleString("es-CO") : "0"}`)
      .moveDown(0.5)
      .text("Descripción del Trabajo Realizado:")
      .moveDown(0.3)
      .text(workReport.workDone || "No se proporcionó descripción del trabajo realizado.", {
        width: 500,
        align: "justify",
      })
      .moveDown(1)

    // Observaciones
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("OBSERVACIONES", { underline: true })
      .moveDown(0.5)
      .font("Helvetica")
      .text(workReport.observation || "No se proporcionaron observaciones.", {
        width: 500,
        align: "justify",
      })
      .moveDown(1)

    // Respuestas a preguntas específicas
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("RESPUESTAS TÉCNICAS", { underline: true })
      .moveDown(0.5)
      .font("Helvetica")
      .text(workReport.responses || "No se proporcionaron respuestas técnicas.", {
        width: 500,
        align: "justify",
      })
      .moveDown(2)

    // Firmas
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("FIRMAS", { underline: true })
      .moveDown(1)
      .font("Helvetica")
      .text("_______________________", { align: "left", width: 250 })
      .text(`Técnico: ${orden.tecnicoId ? orden.tecnicoId.name : "No asignado"}`, { align: "left", width: 250 })
      .moveDown(1)
      .text("_______________________", { align: "left", width: 250 })
      .text(`Instructor: ${orden.instructorId ? orden.instructorId.name : "No asignado"}`, {
        align: "left",
        width: 250,
      })
      .moveDown(1)

    // Pie de página
    const bottomOfPage = doc.page.height - 50
    doc
      .fontSize(8)
      .text(
        `Documento generado automáticamente el ${new Date().toLocaleDateString("es-CO")} a las ${new Date().toLocaleTimeString("es-CO")}`,
        50,
        bottomOfPage,
        { align: "center", width: doc.page.width - 100 },
      )
  }
}

