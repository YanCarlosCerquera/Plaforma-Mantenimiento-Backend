export interface INotificationService {
  sendNotification(data: NotificationData): Promise<void>;
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

export interface NotificationConfig {
  telegramToken: string;
  chatId: string;
  topics: {
    SOLICITANTE: number;
    INSTRUCTOR: number;
  };
}
