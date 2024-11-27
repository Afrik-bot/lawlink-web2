import { EventEmitter } from 'events';
import websocketService from './websocketService';
import { authService } from './authService';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

class NotificationService extends EventEmitter {
  private notifications: Notification[] = [];
  private readonly MAX_NOTIFICATIONS = 100;
  private readonly STORAGE_KEY = 'lawlink_notifications';

  constructor() {
    super();
    this.loadNotifications();
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    websocketService.on('notification', (notification: Notification) => {
      this.addNotification(notification);
    });

    // Listen for specific events that should trigger notifications
    websocketService.on('consultation-request', (data) => {
      this.addNotification({
        id: crypto.randomUUID(),
        type: 'info',
        title: 'New Consultation Request',
        message: `New consultation request from ${data.clientName}`,
        timestamp: Date.now(),
        read: false,
        actionUrl: `/dashboard/consultations/${data.consultationId}`,
        metadata: { consultationId: data.consultationId }
      });
    });

    websocketService.on('message-received', (data) => {
      this.addNotification({
        id: crypto.randomUUID(),
        type: 'info',
        title: 'New Message',
        message: `New message from ${data.senderName}`,
        timestamp: Date.now(),
        read: false,
        actionUrl: `/dashboard/messages/${data.conversationId}`,
        metadata: { conversationId: data.conversationId }
      });
    });

    websocketService.on('document-shared', (data) => {
      this.addNotification({
        id: crypto.randomUUID(),
        type: 'info',
        title: 'Document Shared',
        message: `${data.senderName} shared a document: ${data.documentName}`,
        timestamp: Date.now(),
        read: false,
        actionUrl: `/dashboard/documents/${data.documentId}`,
        metadata: { documentId: data.documentId }
      });
    });
  }

  private loadNotifications() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.notifications = JSON.parse(stored);
      } catch (error) {
        console.error('Error loading notifications:', error);
        this.notifications = [];
      }
    }
  }

  private saveNotifications() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
  }

  private addNotification(notification: Notification) {
    this.notifications.unshift(notification);
    
    // Trim notifications if exceeding maximum
    if (this.notifications.length > this.MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
    }
    
    this.saveNotifications();
    this.emit('notification', notification);
    
    // Check if we should show desktop notification
    const preferences = authService.getUserPreferences();
    if (preferences?.notifications) {
      this.showDesktopNotification(notification);
    }
  }

  private async showDesktopNotification(notification: Notification) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png'
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo192.png'
        });
      }
    }
  }

  getNotifications(options?: { unreadOnly?: boolean; limit?: number }): Notification[] {
    let filtered = [...this.notifications];
    
    if (options?.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }
    
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.emit('notificationRead', notificationId);
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.emit('allNotificationsRead');
  }

  clearNotifications() {
    this.notifications = [];
    this.saveNotifications();
    this.emit('notificationsCleared');
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
