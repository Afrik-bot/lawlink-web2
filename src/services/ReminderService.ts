import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { sendEmail } from './EmailService';
import { SessionSchedule } from './SessionService';

export interface ReminderSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  intervals: number[]; // minutes before session
}

export interface Reminder {
  id: string;
  sessionId: string;
  userId: string;
  type: 'email' | 'push' | 'sms';
  scheduledFor: Timestamp;
  sent: boolean;
  sentAt?: Timestamp;
  error?: string;
}

class ReminderService {
  private readonly remindersCollection = 'reminders';
  private readonly defaultIntervals = [24 * 60, 60, 15]; // 1 day, 1 hour, 15 minutes

  async scheduleReminders(session: SessionSchedule, settings?: ReminderSettings): Promise<void> {
    try {
      const intervals = settings?.intervals || this.defaultIntervals;
      const types: ('email' | 'push' | 'sms')[] = [];

      if (settings?.email ?? true) types.push('email');
      if (settings?.push ?? true) types.push('push');
      if (settings?.sms ?? false) types.push('sms');

      // Schedule reminders for both consultant and client
      await Promise.all([
        this.createUserReminders(session, session.consultantId, intervals, types),
        this.createUserReminders(session, session.clientId, intervals, types),
      ]);
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      throw error;
    }
  }

  private async createUserReminders(
    session: SessionSchedule,
    userId: string,
    intervals: number[],
    types: ('email' | 'push' | 'sms')[]
  ): Promise<void> {
    const startTime = session.scheduledStartTime.toDate();
    const reminders: Reminder[] = [];

    for (const interval of intervals) {
      for (const type of types) {
        const scheduledFor = new Date(startTime.getTime() - interval * 60000);
        if (scheduledFor > new Date()) { // Only schedule future reminders
          const reminder: Reminder = {
            id: `${session.id}_${userId}_${type}_${interval}`,
            sessionId: session.id,
            userId,
            type,
            scheduledFor: Timestamp.fromDate(scheduledFor),
            sent: false,
          };
          reminders.push(reminder);
        }
      }
    }

    // Batch create reminders
    await Promise.all(
      reminders.map(reminder =>
        setDoc(doc(db, this.remindersCollection, reminder.id), reminder)
      )
    );
  }

  async sendReminder(reminder: Reminder): Promise<void> {
    try {
      const sessionDoc = await getDoc(doc(db, 'sessions', reminder.sessionId));
      const userDoc = await getDoc(doc(db, 'users', reminder.userId));

      if (!sessionDoc.exists() || !userDoc.exists()) {
        throw new Error('Session or user not found');
      }

      const session = sessionDoc.data() as SessionSchedule;
      const user = userDoc.data();

      switch (reminder.type) {
        case 'email':
          await this.sendEmailReminder(session, user);
          break;
        case 'push':
          await this.sendPushReminder(session, user);
          break;
        case 'sms':
          await this.sendSMSReminder(session, user);
          break;
      }

      // Mark reminder as sent
      await updateDoc(doc(db, this.remindersCollection, reminder.id), {
        sent: true,
        sentAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      await updateDoc(doc(db, this.remindersCollection, reminder.id), {
        error: error.message,
      });
      throw error;
    }
  }

  private async sendEmailReminder(session: SessionSchedule, user: any): Promise<void> {
    const timeUntilSession = session.scheduledStartTime.toDate().getTime() - Date.now();
    const minutesUntil = Math.round(timeUntilSession / (1000 * 60));

    await sendEmail({
      to: user.email,
      subject: `Reminder: Legal Consultation in ${minutesUntil} minutes`,
      template: 'session-reminder',
      data: {
        userName: user.displayName,
        sessionTitle: session.title,
        startTime: session.scheduledStartTime.toDate(),
        minutesUntil,
        joinUrl: `${window.location.origin}/consultation/${session.roomId || session.id}`,
      },
    });
  }

  private async sendPushReminder(session: SessionSchedule, user: any): Promise<void> {
    // TODO: Implement push notifications
    // This would typically use Firebase Cloud Messaging (FCM)
    throw new Error('Push notifications not implemented yet');
  }

  private async sendSMSReminder(session: SessionSchedule, user: any): Promise<void> {
    // TODO: Implement SMS notifications
    // This would typically use a service like Twilio
    throw new Error('SMS notifications not implemented yet');
  }

  async getUserReminderSettings(userId: string): Promise<ReminderSettings> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    return userData?.reminderSettings || {
      email: true,
      push: true,
      sms: false,
      intervals: this.defaultIntervals,
    };
  }

  async updateUserReminderSettings(
    userId: string,
    settings: Partial<ReminderSettings>
  ): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      reminderSettings: settings,
    });
  }
}

const reminderService = new ReminderService();
export default reminderService;
