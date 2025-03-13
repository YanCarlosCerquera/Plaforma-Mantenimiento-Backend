import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { type Model, Types } from "mongoose"
import type { Response } from "express"
import { WorkReport } from "../entities/work_report.entity"
import type * as PDFKit from "pdfkit"
import { PdfService } from "./pdf.service"

@Injectable()
export class WorkReportPdfService {
  constructor(
    @InjectModel(WorkReport.name) private workReportModel: Model<WorkReport>,
    private readonly pdfService: PdfService
  ) {}

  /**
   * Genera un informe PDF para un reporte de trabajo específico
   * @param id ID del informe de trabajo
   * @param res Objeto Response de Express para enviar el PDF
   */
  async generateReportPDF(id: string, res: Response): Promise<void> {
    try {
      // Validar que el ID sea válido
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException("ID de informe inválido")
      }

      // Obtener el informe con todos los detalles necesarios
      const workReport = await this.workReportModel
        .findById(id)
        .populate({
          path: "orderId",
          populate: [
            {
              path: "solicitud",
              model: "MaintenanceRequest",
              select: "InventoryCode serialNumber maintenanceType description",
            },
            {
              path: "tecnicoId",
              model: "User",
              select: "name email position",
            },
            {
              path: "instructorId",
              model: "User",
              select: "name email position",
            },
          ],
        })
        .lean()

      if (!workReport) {
        throw new NotFoundException(`Informe con ID ${id} no encontrado`)
      }

      // Crear un nuevo documento PDF
      const doc = this.pdfService.createDocument()

      // Configurar la respuesta HTTP
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename=informe-${workReport.Informe}.pdf`)

      // Pipe el PDF a la respuesta
      doc.pipe(res)

      // Generar el contenido del PDF
      this.generatePDFContent(doc, workReport)

      // Finalizar el documento
      doc.end()
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }
      throw new BadRequestException("Error al generar el informe PDF: " + error.message)
    }
  }

  /**
   * Genera el contenido del PDF para un informe de trabajo
   * @param doc Documento PDF
   * @param workReport Datos del informe de trabajo
   */
  private generatePDFContent(doc: PDFKit.PDFDocument, workReport: any): void {
    // Añadir encabezado
    this.pdfService.addHeader(doc, "Informe de Mantenimiento", `Informe No. ${workReport.Informe || "N/A"}`)

    // Información básica del informe
    this.pdfService.addSection(doc, "Información del Informe")

    const infoTable: Array<[string, string]> = [
      ["Número de Informe:", workReport.Informe || "N/A"],
      ["Fecha de Creación:", this.pdfService.formatDate(workReport.createdAt)],
      ["Orden de Trabajo:", workReport.orderId?.radicado || "N/A"],
      ["Código de Inventario:", workReport.orderId?.solicitud?.InventoryCode || "N/A"],
      ["Número de Serie:", workReport.orderId?.solicitud?.serialNumber || "N/A"],
      ["Tipo de Mantenimiento:", workReport.orderId?.solicitud?.maintenanceType || "N/A"],
    ]

    this.pdfService.addInfoTable(doc, infoTable)

    // Descripción del equipo (si existe)
    if (workReport.orderId?.solicitud?.description) {
      this.pdfService.addSection(doc, "Descripción del Equipo")
      this.pdfService.addText(doc, workReport.orderId.solicitud.description)
    }

    // Detalles del trabajo
    this.pdfService.addSection(doc, "Detalles del Trabajo")

    const workDetails: Array<[string, string]> = [
      ["Horas de Trabajo:", `${workReport.hours || 0} horas`],
      ["Costos:", this.pdfService.formatCurrency(workReport.costs || 0)],
    ]

    this.pdfService.addInfoTable(doc, workDetails)

    // Trabajo realizado
    this.pdfService.addSection(doc, "Trabajo Realizado")
    this.pdfService.addText(doc, workReport.workDone || "No se especificó el trabajo realizado.", { align: "justify" })

    // Observaciones
    this.pdfService.addSection(doc, "Observaciones")
    this.pdfService.addText(doc, workReport.observation || "No hay observaciones.", { align: "justify" })

    // Respuestas
    this.pdfService.addSection(doc, "Respuestas")
    this.pdfService.addText(doc, workReport.responses || "No hay respuestas registradas.", { align: "justify" })

    // Verificar si hay suficiente espacio para las firmas
    if (doc.y > doc.page.height - 150) {
      doc.addPage()
    } else {
      doc.moveDown(2)
    }

    // Firmas
    const startY = doc.y

    // Firma del técnico
    this.pdfService.addSignatureArea(
      doc,
      "Técnico:",
      workReport.orderId?.tecnicoId?.name || "N/A",
      workReport.orderId?.tecnicoId?.position || workReport.orderId?.tecnicoId?.email || "",
      50,
      startY,
    )

    // Firma del instructor/supervisor
    this.pdfService.addSignatureArea(
      doc,
      "Supervisor:",
      workReport.orderId?.instructorId?.name || "N/A",
      workReport.orderId?.instructorId?.position || workReport.orderId?.instructorId?.email || "",
      350,
      startY,
    )

    // Pie de página
    this.pdfService.addFooter(
      doc,
      `Informe generado el ${new Date().toLocaleDateString("es-ES")} - ${workReport.Informe} - Sistema de Gestión de Mantenimiento`,
    )
  }
}

