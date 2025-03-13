import { Injectable } from '@nestjs/common';
import { UltraMsgService } from '../Wss.service';
import { INotificationService, NotificationData, NotificationConfig, Email } from '../interfaces/notification.interface';
import axios from 'axios';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationService implements INotificationService {
  private readonly config: NotificationConfig = {
    telegramToken: "7327782691:AAFRGmwrwReJPE9d3DRqBXoZDVKPZ1XgMZY",
    chatId: "-1002352603720",
    topics: {
      SOLICITANTE: 36,
      INSTRUCTOR: 35
    }
  };

  constructor(
    private readonly wssService: UltraMsgService,
    private readonly mailerService: MailerService
  ) {}

  async sendNotification(data: NotificationData): Promise<void> {
    try {
      await Promise.all([
        this.sendWhatsAppNotification(data),
        this.sendTelegramNotification(data),
      ]);
    } catch (error) {
      console.error(`Error sending notifications for ${data.trackingNumber}:`, error);
    }
  }

  async sendNotificationEmail(email: Email, notificationData: NotificationData): Promise<void> {
    try {
      const finalBody = email.body || this.generateTechnicianEmailBody(notificationData);
  
      await this.mailerService.sendMail({
        to: email.to,
        subject: email.subject,
        html: finalBody,
      });
  
      console.log(`✅ Email enviado a: ${email.to}`);
    } catch (error) {
      console.error(`❌ Error al enviar email a ${email.to}:`, error);
      throw error;
    }
  }

  private async sendWhatsAppNotification(data: NotificationData): Promise<void> {
    const message = this.createNotificationMessage(data);
    try {
      await this.wssService.sendMessage(data.recipientPhone, message);
      console.log(`WhatsApp notification sent for ${data.trackingNumber}`);
    } catch (error) {
      console.error(`WhatsApp notification error for ${data.trackingNumber}:`, error);
    }
  }

  private async sendTelegramNotification(data: NotificationData): Promise<void> {
    const message = this.createNotificationMessage(data);
    const topicId = data.isRequester ? this.config.topics.SOLICITANTE : this.config.topics.INSTRUCTOR;

    try {
      await axios.post(`https://api.telegram.org/bot${this.config.telegramToken}/sendMessage`, {
        chat_id: this.config.chatId,
        message_thread_id: topicId,
        text: message
      });
      console.log(`Telegram notification sent for ${data.trackingNumber}`);
    } catch (error) {
      console.error(`Telegram notification error for ${data.trackingNumber}:`, error);
    }
  }

  private createNotificationMessage(data: NotificationData): string {
    return `⚡ *Nueva Orden de Trabajo Asignada*
¡Hola ${data.recipientName}!

Se le ha asignado una nueva orden de trabajo:
📋 *Detalles:*
• N° Seguimiento: #${data.trackingNumber}
• Tipo: ${data.maintenanceType}
• Solicitante: ${data.requesterName || "No especificado"}
• Descripción: ${data.description.substring(0, 100)}${data.description.length > 100 ? '...' : ''}

⚠️ *Acción Requerida:* Por favor, revise y atienda esta orden lo antes posible.

🌐 *Enlaces Útiles:*
• Portal de Mantenimiento: https://mantenimiento.sena.edu.co
• Documentación: https://docs.mantenimiento.sena.edu.co

_Este es un mensaje automático, por favor no responder directamente._`;
  }

  private generateTechnicianEmailBody(data: NotificationData): string {
    return `
      <h2>📢 Nueva Orden de Trabajo</h2>
      <p><strong>Estimado ${data.recipientName},</strong></p>
      <p>Se le ha asignado una nueva orden de trabajo. A continuación los detalles:</p>
      <ul>
        <li><strong>N° Seguimiento:</strong> #${data.trackingNumber}</li>
        <li><strong>Tipo:</strong> ${data.maintenanceType}</li>
        <li><strong>Solicitante:</strong> ${data.requesterName || "No especificado"}</li>
        <li><strong>Descripción:</strong> ${data.description || "Sin descripción"}</li>
      </ul>
      <p>Por favor, revise y atienda la orden lo antes posible.</p>
      <p>📌 <a href="https://mantenimiento.sena.edu.co">Acceder al Sistema</a></p>
      <br>
      <p><em>Este es un mensaje automático, por favor no responder directamente.</em></p>
    `;
  }
}
