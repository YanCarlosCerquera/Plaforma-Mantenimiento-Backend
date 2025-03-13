import { Injectable } from "@nestjs/common"
import * as PDFDocument from "pdfkit"
import * as fs from "fs"
import * as path from "path"

@Injectable()
export class PdfService {
  /**
   * Configuración de estilos para los PDFs
   */
  private styles = {
    fonts: {
      title: "Helvetica-Bold",
      regular: "Helvetica",
      italic: "Helvetica-Oblique",
    },
    fontSize: {
      title: 22,
      subtitle: 18,
      header: 14,
      regular: 12,
      small: 10,
      footer: 8,
    },
    colors: {
      primary: "#39a900", // Verde SENA
      secondary: "#00456e", // Azul SENA
      text: "#333333",
      lightText: "#666666",
      accent: "#f5f5f5",
      border: "#cccccc",
    },
    spacing: {
      margin: 50,
      lineHeight: 1.5,
    },
  }

  /**
   * Crea un nuevo documento PDF
   * @returns Documento PDF
   */
  createDocument(): PDFKit.PDFDocument {
    return new PDFDocument({
      margin: this.styles.spacing.margin,
      size: "A4",
      info: {
        Title: "Informe de Mantenimiento",
        Author: "Sistema de Gestión de Mantenimiento",
        Subject: "Informe técnico",
        Keywords: "mantenimiento, informe, reporte",
        Creator: "SENA",
        Producer: "PDFKit",
      },
    })
  }

  /**
   * Añade un encabezado al documento PDF
   * @param doc Documento PDF
   * @param title Título del documento
   * @param subtitle Subtítulo opcional
   */
  addHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string): void {
    try {
      // Intentar cargar el logo si existe
      const logoPath = path.join(process.cwd(), "src/assets/logo.png")
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 100 })
        doc.moveDown(2)
      }
    } catch (error) {
      console.error("Error al cargar el logo:", error)
    }

    // Título principal
    doc
      .fontSize(this.styles.fontSize.title)
      .font(this.styles.fonts.title)
      .fillColor(this.styles.colors.primary)
      .text(title.toUpperCase(), { align: "center" as const })

    // Subtítulo si existe
    if (subtitle) {
      doc
        .fontSize(this.styles.fontSize.subtitle)
        .font(this.styles.fonts.regular)
        .fillColor(this.styles.colors.secondary)
        .text(subtitle, { align: "center" as const })
    }

    // Línea separadora
    doc
      .moveTo(50, doc.y + 10)
      .lineTo(doc.page.width - 50, doc.y + 10)
      .strokeColor(this.styles.colors.primary)
      .lineWidth(2)
      .stroke()

    doc.moveDown(1)
  }

  /**
   * Añade una sección al documento PDF
   * @param doc Documento PDF
   * @param title Título de la sección
   */
  addSection(doc: PDFKit.PDFDocument, title: string): void {
    doc
      .fontSize(this.styles.fontSize.header)
      .font(this.styles.fonts.title)
      .fillColor(this.styles.colors.secondary)
      .text(title)

    doc.moveDown(0.5)
  }

  /**
   * Añade una tabla de información al documento PDF
   * @param doc Documento PDF
   * @param data Array de pares [clave, valor]
   */
  addInfoTable(doc: PDFKit.PDFDocument, data: Array<[string, string]>): void {
    // Fondo de la tabla
    const startY = doc.y
    const tableHeight = data.length * 25

    doc
      .rect(50, startY, doc.page.width - 100, tableHeight)
      .fillColor(this.styles.colors.accent)
      .fill()

    // Contenido de la tabla
    doc.fillColor(this.styles.colors.text)

    let yPos = startY + 5
    data.forEach((row, index) => {
      // Alternar colores de fondo para las filas
      if (index % 2 === 1) {
        doc
          .rect(50, yPos - 5, doc.page.width - 100, 25)
          .fillColor(this.styles.colors.accent)
          .fill()
      }

      doc
        .font(this.styles.fonts.title)
        .fontSize(this.styles.fontSize.regular)
        .fillColor(this.styles.colors.secondary)
        .text(row[0], 60, yPos, { continued: true, width: 200 })
        .font(this.styles.fonts.regular)
        .fillColor(this.styles.colors.text)
        .text(row[1], { width: 300 })

      yPos = doc.y + 10
      doc.y = yPos
    })

    doc.moveDown(1)
  }

  /**
   * Añade un bloque de texto al documento PDF
   * @param doc Documento PDF
   * @param text Texto a añadir
   * @param options Opciones de formato
   */
  addText(
    doc: PDFKit.PDFDocument,
    text: string,
    options: { align?: "left" | "center" | "right" | "justify"; fontSize?: number; font?: string; color?: string } = {},
  ): void {
    doc
      .font(options.font || this.styles.fonts.regular)
      .fontSize(options.fontSize || this.styles.fontSize.regular)
      .fillColor(options.color || this.styles.colors.text)
      .text(text, {
        align: options.align || "left",
        lineGap: 5,
      })

    doc.moveDown(0.5)
  }

  /**
   * Añade un área de firma al documento PDF
   * @param doc Documento PDF
   * @param title Título del área de firma
   * @param name Nombre de la persona
   * @param position Posición o cargo
   * @param x Posición X
   * @param y Posición Y
   */
  addSignatureArea(doc: PDFKit.PDFDocument, title: string, name: string, position: string, x: number, y: number): void {
    doc
      .fontSize(this.styles.fontSize.small)
      .font(this.styles.fonts.title)
      .fillColor(this.styles.colors.secondary)
      .text(title, x, y)

    doc
      .font(this.styles.fonts.regular)
      .fillColor(this.styles.colors.text)
      .text(name, x, y + 15)
      .text(position, x, y + 30)

    // Línea de firma
    doc
      .moveTo(x, y + 60)
      .lineTo(x + 200, y + 60)
      .strokeColor(this.styles.colors.border)
      .lineWidth(1)
      .stroke()
  }

  /**
   * Añade un pie de página al documento PDF
   * @param doc Documento PDF
   * @param text Texto del pie de página
   */
  addFooter(doc: PDFKit.PDFDocument, text: string): void {
    const pageHeight = doc.page.height

    // Línea separadora
    doc
      .moveTo(50, pageHeight - 70)
      .lineTo(doc.page.width - 50, pageHeight - 70)
      .strokeColor(this.styles.colors.primary)
      .lineWidth(1)
      .stroke()

    doc
      .fontSize(this.styles.fontSize.footer)
      .font(this.styles.fonts.regular)
      .fillColor(this.styles.colors.lightText)
      .text(text, 50, pageHeight - 60, { align: "center" as const })
  }

  /**
   * Formatea una fecha para mostrarla en el PDF
   * @param dateString Fecha en formato string
   * @returns Fecha formateada
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  /**
   * Formatea un valor monetario
   * @param value Valor numérico
   * @returns Valor formateado como moneda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value)
  }
}

