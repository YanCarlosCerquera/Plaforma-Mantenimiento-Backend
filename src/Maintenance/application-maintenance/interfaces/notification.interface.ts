export interface INotificationService {
  sendNotification(data: NotificationData): Promise<void>
  sendNotificationEmail(
    email: Email,
    notificationData?: NotificationData,
    notificaciones?: NotificarFEhcas,
  ): Promise<void>
  sendTechnicianNotification(email: Email, data: TechnicianNotificationData): Promise<void>
  sendEmailWithAttachment(email: EmailWithAttachment): Promise<void>
}

export interface NotificationData {
  recipientName: string
  recipientPhone: string
  trackingNumber: string
  maintenanceType: string
  description: string
  requesterName?: string
  isRequester: boolean
  role?: string // Ahora se usa para diferenciar entre Administrador e Instructor
  environmentName?: string // Nombre del ambiente donde está el activo
  assetInfo?: string // Información básica del activo
}

export interface NotificarFEhcas {
  name: string
  radicado: string
  fechaInicio?: string
  fechaFin: string
  daysRemaining: string
  prioridad: string
  assetInfo: string
}

export interface TechnicianNotificationData {
  name: string
  radicado: string
  fechaInicio?: string
  fechaFin: string
  email: string
  prioridad: string
  assetInfo: string
}

export interface Email {
  to: string
  subject: string
  body?: string // Made optional
}

export interface EmailWithAttachment {
  to: string
  subject: string
  body: string
  attachments: Attachment[]
}

export interface Attachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

export interface NotificationConfig {
  telegramToken: string
  chatId: string
  topics: {
    SOLICITANTE: number
    INSTRUCTOR: number
  }
}

