import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { sendEmail } from './EmailService';

export interface SessionSchedule {
  id: string;
  consultantId: string;
  clientId: string;
  scheduledStartTime: Timestamp;
  scheduledEndTime: Timestamp;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  title: string;
  description?: string;
  roomId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class SessionService {
  private readonly sessionsCollection = 'sessions';
  private readonly videoRoomsCollection = 'videoRooms';

  async scheduleSession(
    consultantId: string,
    clientId: string,
    startTime: Date,
    endTime: Date,
    title: string,
    description?: string
  ): Promise<string> {
    try {
      // Create session document
      const sessionRef = doc(collection(db, this.sessionsCollection));
      const session: SessionSchedule = {
        id: sessionRef.id,
        consultantId,
        clientId,
        scheduledStartTime: Timestamp.fromDate(startTime),
        scheduledEndTime: Timestamp.fromDate(endTime),
        status: 'scheduled',
        title,
        description,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(sessionRef, session);

      // Send email notifications
      await this.sendSessionInvitation(session);

      return sessionRef.id;
    } catch (error) {
      console.error('Error scheduling session:', error);
      throw error;
    }
  }

  async getUpcomingSessions(userId: string, role: 'consultant' | 'client'): Promise<SessionSchedule[]> {
    try {
      const sessionsRef = collection(db, this.sessionsCollection);
      const q = query(
        sessionsRef,
        where(role === 'consultant' ? 'consultantId' : 'clientId', '==', userId),
        where('status', 'in', ['scheduled', 'in-progress']),
        where('scheduledStartTime', '>=', Timestamp.now()),
        orderBy('scheduledStartTime', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data() } as SessionSchedule));
    } catch (error) {
      console.error('Error getting upcoming sessions:', error);
      throw error;
    }
  }

  async startScheduledSession(sessionId: string): Promise<string> {
    try {
      const sessionRef = doc(db, this.sessionsCollection, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const session = sessionDoc.data() as SessionSchedule;
      if (session.status !== 'scheduled') {
        throw new Error('Session is not in scheduled state');
      }

      // Create video room
      const roomRef = doc(collection(db, this.videoRoomsCollection));
      const roomData = {
        id: roomRef.id,
        sessionId,
        createdBy: session.consultantId,
        consultantId: session.consultantId,
        clientId: session.clientId,
        status: 'waiting',
        sessionType: 'consultation',
        title: session.title,
        startTime: serverTimestamp(),
        participants: [],
        connections: {},
      };

      await setDoc(roomRef, roomData);

      // Update session with room ID and status
      await updateDoc(sessionRef, {
        status: 'in-progress',
        roomId: roomRef.id,
        updatedAt: serverTimestamp(),
      });

      // Send notifications
      await this.sendSessionStartNotification(session);

      return roomRef.id;
    } catch (error) {
      console.error('Error starting scheduled session:', error);
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(db, this.sessionsCollection, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const session = sessionDoc.data() as SessionSchedule;
      if (!session.roomId) {
        throw new Error('No active room found for session');
      }

      // Update session status
      await updateDoc(sessionRef, {
        status: 'completed',
        updatedAt: serverTimestamp(),
      });

      // Update video room status
      const roomRef = doc(db, this.videoRoomsCollection, session.roomId);
      await updateDoc(roomRef, {
        status: 'inactive',
        endTime: serverTimestamp(),
      });

      // Send session summary
      await this.sendSessionSummary(session);
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  async cancelSession(sessionId: string, reason?: string): Promise<void> {
    try {
      const sessionRef = doc(db, this.sessionsCollection, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const session = sessionDoc.data() as SessionSchedule;

      await updateDoc(sessionRef, {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: serverTimestamp(),
      });

      // Send cancellation notifications
      await this.sendCancellationNotification(session, reason);
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }

  private async sendSessionInvitation(session: SessionSchedule): Promise<void> {
    const clientDoc = await getDoc(doc(db, 'users', session.clientId));
    const consultantDoc = await getDoc(doc(db, 'users', session.consultantId));
    const client = clientDoc.data();
    const consultant = consultantDoc.data();

    if (!client?.email || !consultant?.email) {
      throw new Error('Missing user email information');
    }

    // Send to client
    await sendEmail({
      to: client.email,
      subject: `Legal Consultation Scheduled: ${session.title}`,
      template: 'session-invitation',
      data: {
        sessionId: session.id,
        clientName: client.displayName,
        consultantName: consultant.displayName,
        startTime: session.scheduledStartTime.toDate(),
        endTime: session.scheduledEndTime.toDate(),
        title: session.title,
        description: session.description,
      },
    });

    // Send to consultant
    await sendEmail({
      to: consultant.email,
      subject: `New Consultation Scheduled: ${session.title}`,
      template: 'session-confirmation',
      data: {
        sessionId: session.id,
        clientName: client.displayName,
        consultantName: consultant.displayName,
        startTime: session.scheduledStartTime.toDate(),
        endTime: session.scheduledEndTime.toDate(),
        title: session.title,
        description: session.description,
      },
    });
  }

  private async sendSessionStartNotification(session: SessionSchedule): Promise<void> {
    const clientDoc = await getDoc(doc(db, 'users', session.clientId));
    const client = clientDoc.data();

    if (!client?.email) {
      throw new Error('Missing client email information');
    }

    await sendEmail({
      to: client.email,
      subject: `Your Legal Consultation is Starting: ${session.title}`,
      template: 'session-starting',
      data: {
        sessionId: session.id,
        roomId: session.roomId,
        clientName: client.displayName,
        title: session.title,
        joinUrl: `${window.location.origin}/consultation/${session.roomId}`,
      },
    });
  }

  private async sendSessionSummary(session: SessionSchedule): Promise<void> {
    const [clientDoc, consultantDoc] = await Promise.all([
      getDoc(doc(db, 'users', session.clientId)),
      getDoc(doc(db, 'users', session.consultantId)),
    ]);

    const client = clientDoc.data();
    const consultant = consultantDoc.data();

    if (!client?.email || !consultant?.email) {
      throw new Error('Missing user email information');
    }

    // Get session recording if available
    const roomRef = doc(db, this.videoRoomsCollection, session.roomId!);
    const roomDoc = await getDoc(roomRef);
    const recordingUrl = roomDoc.data()?.recordingUrl;

    const summaryData = {
      sessionId: session.id,
      title: session.title,
      startTime: session.scheduledStartTime.toDate(),
      endTime: session.scheduledEndTime.toDate(),
      recordingUrl,
      clientName: client.displayName,
      consultantName: consultant.displayName,
    };

    // Send to client
    await sendEmail({
      to: client.email,
      subject: `Consultation Summary: ${session.title}`,
      template: 'session-summary-client',
      data: summaryData,
    });

    // Send to consultant
    await sendEmail({
      to: consultant.email,
      subject: `Consultation Summary: ${session.title}`,
      template: 'session-summary-consultant',
      data: summaryData,
    });
  }

  private async sendCancellationNotification(session: SessionSchedule, reason?: string): Promise<void> {
    const [clientDoc, consultantDoc] = await Promise.all([
      getDoc(doc(db, 'users', session.clientId)),
      getDoc(doc(db, 'users', session.consultantId)),
    ]);

    const client = clientDoc.data();
    const consultant = consultantDoc.data();

    if (!client?.email || !consultant?.email) {
      throw new Error('Missing user email information');
    }

    const cancellationData = {
      sessionId: session.id,
      title: session.title,
      startTime: session.scheduledStartTime.toDate(),
      reason,
      clientName: client.displayName,
      consultantName: consultant.displayName,
    };

    // Send to both parties
    await Promise.all([
      sendEmail({
        to: client.email,
        subject: `Consultation Cancelled: ${session.title}`,
        template: 'session-cancelled',
        data: cancellationData,
      }),
      sendEmail({
        to: consultant.email,
        subject: `Consultation Cancelled: ${session.title}`,
        template: 'session-cancelled',
        data: cancellationData,
      }),
    ]);
  }
}

const sessionService = new SessionService();
export default sessionService;
