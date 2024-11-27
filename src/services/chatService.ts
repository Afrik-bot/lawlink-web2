import { websocketService } from './websocketService';
import { notificationService } from './notificationService';

export interface ChatMessage {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
}

export interface Conversation {
  _id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: Date;
  createdAt: Date;
}

class ChatService {
  private readonly API_BASE = process.env.REACT_APP_API_URL;
  private conversations = new Map<string, ChatMessage[]>();

  constructor() {
    this.setupWebSocket();
  }

  private setupWebSocket() {
    websocketService.subscribe('chat', (message) => {
      const chatMessage = message as ChatMessage;
      this.handleIncomingMessage(chatMessage);
    });
  }

  private handleIncomingMessage(message: ChatMessage) {
    // Add message to conversation
    const conversationId = this.getConversationId(message.senderId, message.receiverId);
    const messages = this.conversations.get(conversationId) || [];
    messages.push(message);
    this.conversations.set(conversationId, messages);

    // Show notification if message is not from current user
    if (message.senderId !== localStorage.getItem('userId')) {
      notificationService.showNotification({
        title: 'New Message',
        body: message.content,
        data: { type: 'chat', conversationId },
      });
    }
  }

  private getConversationId(user1: string, user2: string): string {
    // Create a consistent conversation ID regardless of user order
    return [user1, user2].sort().join('_');
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await fetch(`${this.API_BASE}/conversations`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    return response.json();
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    // Check cache first
    const cachedMessages = this.conversations.get(conversationId);
    if (cachedMessages) {
      return cachedMessages;
    }

    // Fetch from API if not in cache
    const response = await fetch(`${this.API_BASE}/conversations/${conversationId}/messages`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    const messages = await response.json();
    this.conversations.set(conversationId, messages);
    return messages;
  }

  async sendMessage(receiverId: string, content: string, attachments?: File[]): Promise<ChatMessage> {
    // Upload attachments first if any
    let uploadedAttachments;
    if (attachments?.length) {
      uploadedAttachments = await this.uploadAttachments(attachments);
    }

    const response = await fetch(`${this.API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiverId,
        content,
        attachments: uploadedAttachments,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const message = await response.json();
    this.handleIncomingMessage(message);
    return message;
  }

  private async uploadAttachments(files: File[]) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${this.API_BASE}/messages/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload attachments');
    }

    return response.json();
  }

  async markAsRead(messageIds: string[]): Promise<void> {
    await fetch(`${this.API_BASE}/messages/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageIds }),
    });
  }
}

export const chatService = new ChatService();
