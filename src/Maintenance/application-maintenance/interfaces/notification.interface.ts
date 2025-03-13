export interface INotificationService {
  sendNotification(data: NotificationData): Promise<void>;
    sendNotificationEmail(data: Email, notificationData: NotificationData): Promise<void>;
  
  }

export interface NotificationData {
  recipientName: string;
  recipientPhone: string;
  trackingNumber: string;
  maintenanceType: string;
  description: string;
  requesterName?: string;
  isRequester: boolean;
}

export interface Email {
  to: string;
  subject: string;
  body: string;
  
}
interface EmailCongi {
  to: string;
  subject: string;
  body?: string; // Hacerlo opcional
}


export interface NotificationConfig {
  telegramToken: string;
  chatId: string;
  topics: {
    SOLICITANTE: number;
    INSTRUCTOR: number;
  };
}