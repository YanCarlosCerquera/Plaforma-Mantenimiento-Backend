import { Injectable, Logger } from "@nestjs/common"
import type {
  INotificationService,
  NotificationData,
  NotificationConfig,
  Email,
  NotificarFEhcas,
  TechnicianNotificationData,
} from "../interfaces/notification.interface"
import axios from "axios"
import { MailerService } from "@nestjs-modules/mailer"

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name)
  private readonly config: NotificationConfig = {
    telegramToken: process.env.TELEGRAM_TOKEN || "7327782691:AAFRGmwrwReJPE9d3DRqBXoZDVKPZ1XgMZY",
    chatId: process.env.TELEGRAM_CHAT_ID || "-1002352603720",
    topics: {
      SOLICITANTE: 36,
      INSTRUCTOR: 35,
    },
  }

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Envía notificaciones a través de múltiples canales
   * @param data Datos de la notificación
   */
  async sendNotification(data: NotificationData): Promise<void> {
    try {
      this.logger.log(`Iniciando envío de notificaciones para orden #${data.trackingNumber}`)

      // Ejecutar notificaciones en paralelo para mejor rendimiento
      await Promise.all([
        this.sendTelegramNotification(data),
        // Aquí se pueden agregar más canales de notificación en el futuro
      ])

      this.logger.log(`Notificaciones enviadas exitosamente para orden #${data.trackingNumber}`)
    } catch (error) {
      this.logger.error(
        `Error al enviar notificaciones para orden #${data.trackingNumber}: ${error.message}`,
        error.stack,
      )
    }
  }

  /**
   * Envía un correo electrónico de notificación
   * @param email Datos del correo
   * @param notificationData Datos de notificación para técnicos
   * @param notificaciones Datos de notificación para órdenes próximas a vencer
   */
  async sendNotificationEmail(
    email: Email,
    notificationData?: NotificationData,
    notificaciones?: NotificarFEhcas,
  ): Promise<void> {
    try {
      let finalBody = email.body
      let recipientName = "Usuario"

      if (!finalBody && notificationData) {
        finalBody = this.generateTechnicianEmailBody(notificationData)
        recipientName = notificationData.recipientName
      } else if (!finalBody && notificaciones) {
        finalBody = this.generateEmailBody(notificaciones)
        recipientName = notificaciones.name
      } else if (!finalBody) {
        finalBody = this.generateDefaultEmailBody()
      }

      this.logger.log(`Preparando envío de correo a: ${email.to}`)

      await this.mailerService.sendMail({
        to: email.to,
        subject: email.subject,
        html: this.wrapEmailInTemplate(finalBody, recipientName),
      })

      this.logger.log(`✅ Correo enviado exitosamente a: ${email.to}`)
    } catch (error) {
      this.logger.error(`❌ Error al enviar correo a ${email.to}: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Envía una notificación específica para técnicos
   * @param email Datos del correo
   * @param data Datos del técnico y la orden asignada
   */
  async sendTechnicianNotification(email: Email, data: TechnicianNotificationData): Promise<void> {
    try {
      this.logger.log(`Iniciando envío de notificación a técnico: ${data.name} (${email.to})`)

      await this.sendNotificationEmail(
        {
          to: email.to,
          subject: email.subject,
          body: this.generateTechnicalBody(data),
        },
        null,
        null,
      )

      this.logger.log(`✅ Notificación a técnico enviada exitosamente a: ${email.to}`)
    } catch (error) {
      this.logger.error(`❌ Error al enviar notificación a técnico ${email.to}: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Envía una notificación por Telegram
   * @param data Datos de la notificación
   */
  private async sendTelegramNotification(data: NotificationData): Promise<void> {
    const message = this.createNotificationMessage(data)
    const topicId = data.isRequester ? this.config.topics.SOLICITANTE : this.config.topics.INSTRUCTOR

    try {
      this.logger.log(`Enviando notificación por Telegram para orden #${data.trackingNumber}`)

      await axios.post(`https://api.telegram.org/bot${this.config.telegramToken}/sendMessage`, {
        chat_id: this.config.chatId,
        message_thread_id: topicId,
        text: message,
        parse_mode: "Markdown",
      })

      this.logger.log(`✅ Notificación por Telegram enviada para orden #${data.trackingNumber}`)
    } catch (error) {
      this.logger.error(
        `❌ Error en notificación por Telegram para orden #${data.trackingNumber}: ${error.message}`,
        error.stack,
      )
    }
  }

  /**
   * Crea un mensaje de notificación para Telegram
   * @param data Datos de la notificación
   */
  private createNotificationMessage(data: NotificationData): string {
    return `⚡ *Nueva Orden de Trabajo Asignada*
¡Hola ${data.recipientName}!

Se le ha asignado una nueva orden de trabajo:
📋 *Detalles:*
• N° Seguimiento: #${data.trackingNumber}
• Tipo: ${data.maintenanceType}
• Solicitante: ${data.requesterName || "No especificado"}
• Descripción: ${data.description.substring(0, 100)}${data.description.length > 100 ? "..." : ""}

⚠️ *Acción Requerida:* Por favor, revise y atienda esta orden lo antes posible.

🌐 *Enlaces Útiles:*
• Portal de Mantenimiento: https://mantenimiento.sena.edu.co
• Documentación: https://docs.mantenimiento.sena.edu.co

_Este es un mensaje automático, por favor no responder directamente._`
  }

  /**
   * Genera el cuerpo del correo para técnicos
   * @param data Datos de la notificación
   */
  private generateTechnicianEmailBody(data: NotificationData): string {
    return `
      <div style="padding: 20px; border-radius: 10px; background-color: #f9f9f9; border-left: 5px solid #2563eb;">
        <h2 style="color: #2563eb; margin-top: 0;">📢 Nueva Orden de Trabajo</h2>
        <p><strong>Estimado/a ${data.recipientName},</strong></p>
        <p>Se le ha asignado una nueva orden de trabajo. A continuación los detalles:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 40%;">N° Seguimiento:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">#${data.trackingNumber}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Tipo:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.maintenanceType}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Solicitante:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.requesterName || "No especificado"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Descripción:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.description || "Sin descripción"}</td>
          </tr>
        </table>
        
        <p>Por favor, revise y atienda la orden lo antes posible.</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="https://mantenimiento.sena.edu.co" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder al Sistema</a>
        </div>
      </div>
    `
  }

  /**
   * Genera el cuerpo del correo para órdenes próximas a vencer
   * @param data Datos de la notificación
   */
  private generateEmailBody(data: NotificarFEhcas): string {
    // Determinar el color según la prioridad
    let priorityColor = "#2563eb" // Azul por defecto
    let priorityIcon = "🔵"

    if (data.prioridad.toLowerCase().includes("alta")) {
      priorityColor = "#dc2626" // Rojo para alta prioridad
      priorityIcon = "🔴"
    } else if (data.prioridad.toLowerCase().includes("media")) {
      priorityColor = "#f59e0b" // Naranja para media prioridad
      priorityIcon = "🟠"
    }

    // Determinar el estilo según los días restantes
    let daysRemainingStyle = ""
    let daysMessage = ""

    if (Number.parseInt(data.daysRemaining) <= 2) {
      daysRemainingStyle = "color: #dc2626; font-weight: bold;" // Rojo para urgente
      daysMessage =
        "<p style='color: #dc2626; font-weight: bold;'>⚠️ ¡ATENCIÓN! Esta orden está a punto de vencer y requiere atención inmediata.</p>"
    } else if (Number.parseInt(data.daysRemaining) <= 5) {
      daysRemainingStyle = "color: #f59e0b; font-weight: bold;" // Naranja para próximo
      daysMessage = "<p style='color: #f59e0b;'>⚠️ Esta orden vencerá pronto. Por favor atiéndala con prontitud.</p>"
    }

    return `
      <div style="padding: 20px; border-radius: 10px; background-color: #f9f9f9; border-left: 5px solid ${priorityColor};">
        <h2 style="color: ${priorityColor}; margin-top: 0;">⏰ Orden de Trabajo Próxima a Vencer</h2>
        <p><strong>Estimado/a ${data.name},</strong></p>
        <p>Le informamos que tiene una orden de trabajo que está próxima a vencer:</p>
        
        ${daysMessage}
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 40%;">Número de Radicado:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.radicado}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Fecha de Vencimiento:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.fechaFin}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Días Restantes:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; ${daysRemainingStyle}">${data.daysRemaining} día(s)</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Prioridad:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: ${priorityColor};">${priorityIcon} ${data.prioridad}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Equipo:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.assetInfo}</td>
          </tr>
        </table>
        
        <p>Por favor, complete esta orden de trabajo antes de la fecha de vencimiento para evitar retrasos en el mantenimiento.</p>
        <p>Si ya ha completado el trabajo, por favor registre el informe correspondiente en el sistema.</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="https://mantenimiento.sena.edu.co" style="background-color: ${priorityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder al Sistema</a>
        </div>
      </div>
    `
  }

  /**
   * Genera el cuerpo del correo para técnicos con nueva orden asignada
   * @param data Datos del técnico y la orden
   */
  private generateTechnicalBody(data: TechnicianNotificationData): string {
    // Determinar el color según la prioridad
    let priorityColor = "#2563eb" // Azul por defecto
    let priorityIcon = "🔵"

    if (data.prioridad.toLowerCase().includes("alta")) {
      priorityColor = "#dc2626" // Rojo para alta prioridad
      priorityIcon = "🔴"
    } else if (data.prioridad.toLowerCase().includes("media")) {
      priorityColor = "#f59e0b" // Naranja para media prioridad
      priorityIcon = "🟠"
    }

    return `
      <div style="padding: 20px; border-radius: 10px; background-color: #f9f9f9; border-left: 5px solid ${priorityColor};">
        <h2 style="color: ${priorityColor}; margin-top: 0;">🔧 Nueva Orden de Trabajo Asignada</h2>
        <p><strong>Estimado/a ${data.name},</strong></p>
        <p>Le informamos que se le ha asignado una nueva orden de trabajo:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 40%;">Número de Radicado:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.radicado}</td>
          </tr>
          ${
            data.fechaInicio
              ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Fecha de Inicio:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.fechaInicio}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Fecha de Vencimiento:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.fechaFin}</td>
          </tr>
         
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Prioridad:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: ${priorityColor};">${priorityIcon} ${data.prioridad}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Equipo:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${data.assetInfo}</td>
          </tr>
        </table>
        
        <p>Por favor, revise y atienda esta orden lo antes posible.</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="https://mantenimiento.sena.edu.co" style="background-color: ${priorityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder al Sistema</a>
        </div>
      </div>
    `
  }

  /**
   * Genera un cuerpo de correo por defecto
   */
  private generateDefaultEmailBody(): string {
    return `
      <div style="padding: 20px; border-radius: 10px; background-color: #f9f9f9; border-left: 5px solid #2563eb;">
        <h2 style="color: #2563eb; margin-top: 0;">📋 Notificación del Sistema de Mantenimiento</h2>
        <p>Ha recibido una notificación del sistema de mantenimiento.</p>
        <p>Por favor, acceda al sistema para más detalles.</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="https://mantenimiento.sena.edu.co" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder al Sistema</a>
        </div>
      </div>
    `
  }

  /**
   * Envuelve el contenido del correo en una plantilla común
   * @param content Contenido del correo
   * @param recipientName Nombre del destinatario
   */
  private wrapEmailInTemplate(content: string, recipientName: string): string {
    const currentDate = new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sistema de Mantenimiento SENA</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Encabezado -->
          <div style="background-color: #2563eb; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Sistema de Mantenimiento SENA</h1>
          </div>
          
          <!-- Contenido principal -->
          <div style="padding: 20px;">
            ${content}
          </div>
          
          <!-- Pie de página -->
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>Este correo fue enviado el ${currentDate}</p>
            <p>Sistema de Gestión de Mantenimiento SENA</p>
            <p><em>Este es un mensaje automático, por favor no responda a este correo.</em></p>
            <div style="margin-top: 15px;">
              <a href="https://mantenimiento.sena.edu.co" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Portal</a>
              <a href="https://docs.mantenimiento.sena.edu.co" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Documentación</a>
              <a href="https://www.sena.edu.co" style="color: #2563eb; text-decoration: none; margin: 0 10px;">SENA</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

