export interface MessageAttachment {
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface Message {
  _id: string;
  sender: string;
  recipient: string;
  content: string;
  attachments: MessageAttachment[];
  readAt?: Date;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageThread {
  _id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface MessageDraft {
  recipient: string;
  content: string;
  attachments: File[];
  replyTo?: string;
}
