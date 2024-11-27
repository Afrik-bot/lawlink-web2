import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { addMinutes } from 'date-fns';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { SessionSchedule } from './SessionService';

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
  private googleAuth: OAuth2Client;

  constructor() {
    this.googleAuth = new OAuth2Client({
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
      redirectUri: `${window.location.origin}/auth/google/callback`,
    });
  }

  async addToGoogleCalendar(session: SessionSchedule, userEmail: string): Promise<string> {
    try {
      // Get user's Google credentials
      const userDoc = await getDoc(doc(db, 'users', session.clientId));
      const userData = userDoc.data();
      const credentials = userData?.calendarCredentials?.google as CalendarCredentials;

      if (!credentials) {
        throw new Error('Google Calendar not connected');
      }

      // Set up auth
      this.googleAuth.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        expiry_date: credentials.expiryDate,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

      // Create calendar event
      const event = {
        summary: session.title,
        description: session.description,
        start: {
          dateTime: session.scheduledStartTime.toDate().toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: session.scheduledEndTime.toDate().toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: [{ email: userEmail }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
        conferenceData: {
          createRequest: {
            requestId: session.id,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
      });

      // Store calendar event reference
      const calendarEvent: CalendarEvent = {
        id: `google_${response.data.id}`,
        provider: 'google',
        eventId: response.data.id!,
        sessionId: session.id,
        createdAt: new Date(),
      };

      await updateDoc(doc(db, 'sessions', session.id), {
        calendarEvents: {
          google: calendarEvent,
        },
      });

      return response.data.id!;
    } catch (error) {
      console.error('Error adding to Google Calendar:', error);
      throw error;
    }
  }

  // Add Outlook calendar integration here
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
        const userDoc = await getDoc(doc(db, 'users', session.clientId));
        const userData = userDoc.data();
        const credentials = userData?.calendarCredentials?.google as CalendarCredentials;

        if (!credentials) {
          throw new Error('Google Calendar not connected');
        }

        this.googleAuth.setCredentials({
          access_token: credentials.accessToken,
          refresh_token: credentials.refreshToken,
          expiry_date: credentials.expiryDate,
        });

        const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: calendarEvent.eventId,
        });
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
