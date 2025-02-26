import { Injectable } from '@nestjs/common';
import { UltraMsgService } from '../Wss.service';
import { INotificationService, NotificationData, NotificationConfig } from '../interfaces/notification.interface';
import axios from 'axios';

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
    private readonly wssService: UltraMsgService
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
    const stickerFileId = "CAACAgEAAxkBAAMHZ2M0z9nsiq93Cx7mkxmyvO8Eo_YAAkEFAAJ6ByBH1BcAAePLwOg3NgQ";

    try {
      await Promise.all([
        axios.post(`https://api.telegram.org/bot${this.config.telegramToken}/sendMessage`, {
          chat_id: this.config.chatId,
          message_thread_id: topicId,
          text: message
        }),
        axios.post(`https://api.telegram.org/bot${this.config.telegramToken}/sendSticker`, {
          chat_id: this.config.chatId,
          message_thread_id: topicId,
          sticker: stickerFileId
        })
      ]);
      console.log(`Telegram notification sent for ${data.trackingNumber}`);
    } catch (error) {
      console.error(`Telegram notification error for ${data.trackingNumber}:`, error);
    }
  }

  private createNotificationMessage(data: NotificationData): string {
    // Puedes crear diferentes plantillas según el tipo de mantenimiento o estado
    const templates = {
      requester: {
        new: `🔔 *Nueva Solicitud de Mantenimiento*
¡Hola ${data.recipientName}!

Su solicitud ha sido registrada exitosamente:
📝 *Detalles de la Solicitud:*
• N° Seguimiento: #${data.trackingNumber}
• Tipo: ${data.maintenanceType}
• Estado: En Proceso
• Descripción: ${data.description.substring(0, 100)}${data.description.length > 100 ? '...' : ''}

ℹ️ Un técnico especializado revisará su solicitud y le mantendremos informado sobre el progreso.

🔍 *Seguimiento:* Puede consultar el estado de su solicitud en cualquier momento usando su número de seguimiento.`,

        update: `🔄 *Actualización de Solicitud*
¡Hola ${data.recipientName}!
Su solicitud #${data.trackingNumber} ha sido actualizada.`
      },
      technician: {
        new: `⚡ *Nueva Solicitud Asignada*
¡Hola ${data.recipientName}!

Se le ha asignado una nueva solicitud que requiere su atención:
📋 *Detalles de la Solicitud:*
• N° Seguimiento: #${data.trackingNumber}
• Tipo: ${data.maintenanceType}
• Solicitante: ${data.requesterName}
• Descripción: ${data.description.substring(0, 100)}${data.description.length > 100 ? '...' : ''}

⚠️ *Acción Requerida:* Por favor, revise y atienda esta solicitud lo antes posible.`,

        reminder: `⏰ *Recordatorio*
¡Hola ${data.recipientName}!
La solicitud #${data.trackingNumber} está pendiente de atención.`
      }
    };

    // Seleccionar la plantilla base según el tipo de usuario
    const baseMessage = data.isRequester ? templates.requester.new : templates.technician.new;

    // Añadir pie de página con enlaces
    return `${baseMessage}

🌐 *Enlaces Útiles:*
• Portal de Mantenimiento: https://mantenimiento.sena.edu.co
• Canal de Soporte: https://t.me/+iFfUv76--XtjNzlh
• Documentación: https://docs.mantenimiento.sena.edu.co

_Este es un mensaje automático, por favor no responder directamente._`;
  }
}
