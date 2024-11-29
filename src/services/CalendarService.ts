import { addMinutes } from 'date-fns';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { SessionSchedule } from './SessionService';
import axios from 'axios';

interface CalendarCredentials {
  provider: 'google' | 'outlook';
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

interface CalendarEvent {
  id: string;
  provider: 'google' | 'outlook';
  eventId: string;
  sessionId: string;
  createdAt: Date;
}

export class CalendarService {
  private readonly GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

  async addToGoogleCalendar(session: SessionSchedule, userEmail: string): Promise<string> {
    try {
      // Get user's Google credentials
      const userDoc = await getDoc(doc(db, 'users', session.clientId));
      const userData = userDoc.data();
      const credentials = userData?.calendarCredentials?.google as CalendarCredentials;

      if (!credentials) {
        throw new Error('Google Calendar not connected');
      }

      const event = {
        summary: `LawLink Session with ${session.consultantName}`,
        description: session.description || 'Legal consultation session',
        start: {
          dateTime: session.startTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: addMinutes(new Date(session.startTime), session.duration).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: [{ email: userEmail }],
        reminders: {
          useDefault: true,
        },
      };

      const response = await axios.post(
        `${this.GOOGLE_CALENDAR_API}/calendars/primary/events`,
        event,
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const eventId = response.data.id;

      // Store the calendar event reference
      const calendarEvent: CalendarEvent = {
        id: `${session.id}-google`,
        provider: 'google',
        eventId,
        sessionId: session.id,
        createdAt: new Date(),
      };

      await updateDoc(doc(db, 'users', session.clientId), {
        calendarEvents: [...(userData?.calendarEvents || []), calendarEvent],
      });

      return eventId;
    } catch (error) {
      console.error('Error adding event to Google Calendar:', error);
      throw error;
    }
  }

  async removeFromGoogleCalendar(eventId: string, userId: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      const credentials = userData?.calendarCredentials?.google as CalendarCredentials;

      if (!credentials) {
        throw new Error('Google Calendar not connected');
      }

      await axios.delete(
        `${this.GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
          },
        }
      );

      // Remove the calendar event reference
      const updatedEvents = (userData?.calendarEvents || []).filter(
        (event: CalendarEvent) => event.eventId !== eventId
      );

      await updateDoc(doc(db, 'users', userId), {
        calendarEvents: updatedEvents,
      });
    } catch (error) {
      console.error('Error removing event from Google Calendar:', error);
      throw error;
    }
  }

  async addToOutlookCalendar(session: SessionSchedule, userEmail: string): Promise<string> {
    // TODO: Implement Outlook calendar integration
    throw new Error('Outlook calendar integration not implemented yet');
  }

  async removeFromCalendar(session: SessionSchedule, provider: 'google' | 'outlook'): Promise<void> {
    try {
      const sessionDoc = await getDoc(doc(db, 'sessions', session.id));
      const sessionData = sessionDoc.data();
      const calendarEvent = sessionData?.calendarEvents?.[provider] as CalendarEvent;

      if (!calendarEvent) {
        return;
      }

      if (provider === 'google') {
        await this.removeFromGoogleCalendar(calendarEvent.eventId, session.clientId);
      }

      // Remove calendar event reference
      await updateDoc(doc(db, 'sessions', session.id), {
        [`calendarEvents.${provider}`]: null,
      });
    } catch (error) {
      console.error('Error removing from calendar:', error);
      throw error;
    }
  }
}

const calendarService = new CalendarService();
export default calendarService;
