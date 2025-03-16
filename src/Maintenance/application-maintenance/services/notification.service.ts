import { Injectable, Logger } from "@nestjs/common"
import type {
  INotificationService,
  NotificationData,
  NotificationConfig,
  Email,
  NotificarFEhcas,
  TechnicianNotificationData,
  EmailWithAttachment,
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

  // Asegurémonos de que la verificación de roles sea insensible a mayúsculas/minúsculas
  // para evitar problemas similares en el futuro

  private generateEmailBodyByRole(data: NotificationData): string {
    // Convertir el rol a minúsculas para comparación insensible a mayúsculas/minúsculas
    const role = data.role?.toLowerCase()

    if (data.isRequester) {
      return this.generateRequesterEmailBody(data)
    } else if (role === "administrador" || role === "admin") {
      return this.generateAdminEmailBody(data)
    } else if (role === "instructor") {
      return this.generateInstructorEmailBody(data)
    } else {
      return this.generateTechnicianEmailBody(data)
    }
  }

  // Reemplazar el bloque de condiciones en sendNotificationEmail con una llamada a este método
  async sendNotificationEmail(
    email: Email,
    notificationData?: NotificationData,
    notificaciones?: NotificarFEhcas,
  ): Promise<void> {
    try {
      let finalBody = email.body
      let recipientName = "Usuario"

      if (!finalBody && notificationData) {
        // Usar el nuevo método para determinar el cuerpo del correo
        finalBody = this.generateEmailBodyByRole(notificationData)
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
        html: finalBody,
      })

      this.logger.log(`✅ Correo enviado exitosamente a: ${email.to}`)
    } catch (error) {
      this.logger.error(`❌ Error al enviar correo a ${email.to}: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Envía un correo electrónico con archivos adjuntos
   * @param email Datos del correo con archivos adjuntos
   */
  async sendEmailWithAttachment(email: EmailWithAttachment): Promise<void> {
    try {
      this.logger.log(`Preparando envío de correo con adjunto a: ${email.to}`)

      await this.mailerService.sendMail({
        to: email.to,
        subject: email.subject,
        html: email.body,
        attachments: email.attachments,
      })

      this.logger.log(`✅ Correo con adjunto enviado exitosamente a: ${email.to}`)
    } catch (error) {
      this.logger.error(`❌ Error al enviar correo con adjunto a ${email.to}: ${error.message}`, error.stack)
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

  // También actualizar el método createNotificationMessage para usar la misma lógica
  private createNotificationMessage(data: NotificationData): string {
    // Mensaje simplificado para Telegram
    let title = "Nueva Solicitud de Mantenimiento"
    const role = data.role?.toLowerCase()

    if (data.isRequester) {
      title = "Su Solicitud de Mantenimiento ha sido Registrada"
    } else if (role === "administrador" || role === "admin") {
      title = "Nueva Solicitud de Mantenimiento - Para Administrador"
    } else if (role === "instructor") {
      title = "Nueva Solicitud de Mantenimiento - Para Instructor"
    }

    let message = `${title}

Hola ${data.recipientName},

Detalles:
- Seguimiento: #${data.trackingNumber}
- Tipo: ${data.maintenanceType}
- Solicitante: ${data.requesterName || "No especificado"}

Descripción: 
${data.description.substring(0, 100)}${data.description.length > 100 ? "..." : ""}`

    // Agregar información del ambiente si está disponible
    if (data.environmentName) {
      message += `\n\nAmbiente: ${data.environmentName}`
    }

    // Agregar información del activo si está disponible
    if (data.assetInfo) {
      message += `\n\nActivo: ${data.assetInfo}`
    }

    // Agregar mensaje final según el tipo de destinatario
    if (data.isRequester) {
      message += "\n\nSu solicitud será atendida a la brevedad posible."
    } else if (role === "administrador" || role === "admin") {
      message += "\n\nComo Administrador, por favor supervise esta solicitud en el sistema."
    } else if (role === "instructor") {
      message += "\n\nComo Instructor responsable del ambiente, por favor revise esta solicitud."
    } else {
      message += "\n\nPor favor revise esta solicitud en el sistema."
    }

    return message
  }

  /**
   * Genera el cuerpo del correo para solicitantes
   * @param data Datos de la notificación
   */
  private generateRequesterEmailBody(data: NotificationData): string {
    return `
<h2>Su Solicitud de Mantenimiento ha sido Registrada</h2>

<p>Estimado/a ${data.recipientName},</p>

<p>Le informamos que su solicitud de mantenimiento ha sido registrada exitosamente en nuestro sistema:</p>

<ul>
  <li><strong>N° Seguimiento:</strong> #${data.trackingNumber}</li>
  <li><strong>Tipo:</strong> ${data.maintenanceType}</li>
  <li><strong>Descripción:</strong> ${data.description || "Sin descripción"}</li>
</ul>

<p>Su solicitud será atendida a la brevedad posible. Puede consultar el estado de su solicitud utilizando el número de seguimiento.</p>

<p>Gracias por su atención.</p>

<hr>
<p><em>Este es un mensaje automático, por favor no responda a este correo.</em></p>
    `
  }

  /**
   * Genera el cuerpo del correo para administradores
   * @param data Datos de la notificación
   */
  private generateAdminEmailBody(data: NotificationData): string {
    return `
<h2>Nueva Solicitud de Mantenimiento - Para Administrador</h2>

<p>Estimado/a Administrador/a ${data.recipientName},</p>

<p>Le informamos que se ha registrado una nueva solicitud de mantenimiento que requiere su supervisión:</p>

<ul>
  <li><strong>N° Seguimiento:</strong> #${data.trackingNumber}</li>
  <li><strong>Tipo:</strong> ${data.maintenanceType}</li>
  <li><strong>Solicitante:</strong> ${data.requesterName || "No especificado"}</li>
  <li><strong>Descripción:</strong> ${data.description || "Sin descripción"}</li>
  ${data.environmentName ? `<li><strong>Ambiente:</strong> ${data.environmentName}</li>` : ""}
</ul>

<p>Como Administrador del sistema, por favor supervise esta solicitud y asigne los recursos necesarios para su atención.</p>

<p>Gracias por su atención.</p>

<hr>
<p><em>Este es un mensaje automático, por favor no responda a este correo.</em></p>
    `
  }

  /**
   * Genera el cuerpo del correo para instructores
   * @param data Datos de la notificación
   */
  private generateInstructorEmailBody(data: NotificationData): string {
    return `
<h2>Nueva Solicitud de Mantenimiento - Para Instructor</h2>

<p>Estimado/a Instructor/a ${data.recipientName},</p>

<p>Le informamos que se ha registrado una nueva solicitud de mantenimiento para un activo en su ambiente:</p>

<ul>
  <li><strong>N° Seguimiento:</strong> #${data.trackingNumber}</li>
  <li><strong>Tipo:</strong> ${data.maintenanceType}</li>
  <li><strong>Solicitante:</strong> ${data.requesterName || "No especificado"}</li>
  <li><strong>Descripción:</strong> ${data.description || "Sin descripción"}</li>
  ${data.environmentName ? `<li><strong>Ambiente a su cargo:</strong> ${data.environmentName}</li>` : ""}
</ul>

<p>Como Instructor responsable del ambiente, por favor esté atento al proceso de mantenimiento.</p>

<p>Gracias por su atención.</p>

<hr>
<p><em>Este es un mensaje automático, por favor no responda a este correo.</em></p>
    `
  }

  /**
   * Genera el cuerpo del correo para técnicos e instructores (genérico)
   * @param data Datos de la notificación
   */
  private generateTechnicianEmailBody(data: NotificationData): string {
    return `
<h2>Nueva Solicitud de Mantenimiento</h2>

<p>Estimado/a ${data.recipientName},</p>

<p>Le informamos que se ha registrado una nueva solicitud de mantenimiento que requiere su atención:</p>

<ul>
  <li><strong>N° Seguimiento:</strong> #${data.trackingNumber}</li>
  <li><strong>Tipo:</strong> ${data.maintenanceType}</li>
  <li><strong>Solicitante:</strong> ${data.requesterName || "No especificado"}</li>
  <li><strong>Descripción:</strong> ${data.description || "Sin descripción"}</li>
  ${data.environmentName ? `<li><strong>Ambiente:</strong> ${data.environmentName}</li>` : ""}
</ul>

<p>Por favor, revise esta solicitud en el sistema de mantenimiento.</p>

<p>Gracias por su atención.</p>

<hr>
<p><em>Este es un mensaje automático, por favor no responda a este correo.</em></p>
    `
  }

  /**
   * Genera el cuerpo del correo para órdenes próximas a vencer
   * @param data Datos de la notificación
   */
  private generateEmailBody(data: NotificarFEhcas): string {
    // Mensaje de alerta según los días restantes
    let daysMessage = ""

    if (Number.parseInt(data.daysRemaining) <= 2) {
      daysMessage = `Esta orden vence en ${data.daysRemaining} día(s) y requiere atención inmediata.`
    } else if (Number.parseInt(data.daysRemaining) <= 5) {
      daysMessage = `Esta orden vence en ${data.daysRemaining} día(s). Por favor atiéndala pronto.`
    }

    return `
<h2>Notificación de Orden de Trabajo Próxima a Vencer</h2>

<p>Estimado/a ${data.name},</p>

<p>Le informamos que tiene una orden de trabajo que está próxima a vencer:</p>

${daysMessage ? `<p><strong>${daysMessage}</strong></p>` : ""}

<ul>
  <li><strong>Número de Radicado:</strong> ${data.radicado}</li>
  <li><strong>Fecha de Vencimiento:</strong> ${data.fechaFin}</li>
  <li><strong>Días Restantes:</strong> ${data.daysRemaining} día(s)</li>
  <li><strong>Prioridad:</strong> ${data.prioridad}</li>
  <li><strong>Equipo:</strong> ${data.assetInfo}</li>
</ul>

<p>Por favor, complete esta orden de trabajo antes de la fecha de vencimiento para evitar retrasos en el mantenimiento.</p>

<p>Si ya ha completado el trabajo, por favor registre el informe correspondiente en el sistema.</p>

<p>Gracias por su atención.</p>

<hr>
<p><em>Este es un mensaje automático, por favor no responda a este correo.</em></p>
    `
  }

  /**
   * Genera el cuerpo del correo para técnicos con nueva orden asignada
   * @param data Datos del técnico y la orden
   */
  private generateTechnicalBody(data: TechnicianNotificationData): string {
    return `
<h2>Asignación de Nueva Orden de Trabajo</h2>

<p>Estimado/a ${data.name},</p>

<p>Se le ha asignado una nueva orden de trabajo con los siguientes detalles:</p>

<ul>
  <li><strong>Número de Radicado:</strong> ${data.radicado}</li>
  ${data.fechaInicio ? `<li><strong>Fecha de Inicio:</strong> ${data.fechaInicio}</li>` : ""}
  <li><strong>Fecha de Vencimiento:</strong> ${data.fechaFin}</li>
  <li><strong>Prioridad:</strong> ${data.prioridad}</li>
  <li><strong>Equipo:</strong> ${data.assetInfo}</li>
</ul>

<p>Por favor, revise y atienda esta orden lo antes posible según su nivel de prioridad.</p>

<p>Acceda al sistema para más detalles: <a href="https://mantenimiento.sena.edu.co">https://mantenimiento.sena.edu.co</a></p>

<p>Gracias por su atención.</p>

<hr>
<p><em>Este es un mensaje automático, por favor no responda a este correo.</em></p>
    `
  }

  /**
   * Genera un cuerpo de correo por defecto
   */
  private generateDefaultEmailBody(): string {
    return `
<h2>Notificación del Sistema de Mantenimiento</h2>

<p>Ha recibido una notificación del sistema de mantenimiento.</p>

<p>Por favor, acceda al sistema para más detalles: <a href="https://mantenimiento.sena.edu.co">https://mantenimiento.sena.edu.co</a></p>

<hr>
<p><em>Este es un mensaje automático, por favor no responda a este correo.</em></p>
    `
  }
}

