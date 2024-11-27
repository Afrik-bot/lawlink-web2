export interface Notification {
  _id: string;
  recipient: string;
  type: 'appointment_scheduled' | 'appointment_reminder' | 'appointment_canceled' |
        'message_received' | 'document_shared' | 'payment_received' |
        'payment_due' | 'stream_started';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  email: {
    appointments: boolean;
    messages: boolean;
    documents: boolean;
    payments: boolean;
    streams: boolean;
  };
  push: {
    appointments: boolean;
    messages: boolean;
    documents: boolean;
    payments: boolean;
    streams: boolean;
  };
  inApp: {
    appointments: boolean;
    messages: boolean;
    documents: boolean;
    payments: boolean;
    streams: boolean;
  };
}
