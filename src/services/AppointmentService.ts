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
  Timestamp,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { format, addDays, addWeeks, addMonths, differenceInMinutes, parse, startOfDay, endOfDay } from 'date-fns';
import calendarService from './CalendarService';
import reminderService from './ReminderService';
import { sendEmail } from './EmailService';

export interface Appointment {
  id: string;
  consultantId: string;
  clientId: string;
  appointmentTypeId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  calendarEventIds?: {
    google?: string;
    outlook?: string;
  };
  recurringPatternId?: string;
  isRecurring?: boolean;
}

export interface AppointmentType {
  id: string;
  consultantId: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description?: string;
  color?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0-6, where 0 is Sunday
  endDate?: Date;
  occurrences?: number;
}

export interface ConsultantAvailability {
  id: string;
  consultantId: string;
  weeklySchedule: {
    [key: number]: { // 0-6, where 0 is Sunday
      start: string; // HH:mm format
      end: string;
      breakStart?: string;
      breakEnd?: string;
    };
  };
  exceptions: {
    date: string; // YYYY-MM-DD format
    available: boolean;
    customHours?: {
      start: string;
      end: string;
    };
  }[];
  timezone: string;
  bufferBetweenAppointments: number; // minutes
  maxAdvanceBooking: number; // days
  minNoticeBooking: number; // hours
}

class AppointmentService {
  private appointmentsCollection = 'appointments';
  private appointmentTypesCollection = 'appointmentTypes';
  private availabilityCollection = 'consultantAvailability';
  private recurringPatternsCollection = 'recurringPatterns';

  async createAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    try {
      // Create appointment document
      const appointmentRef = doc(collection(db, this.appointmentsCollection));
      const now = serverTimestamp();
      
      const appointment: Appointment = {
        ...data,
        id: appointmentRef.id,
        status: 'scheduled',
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(appointmentRef, appointment);

      // Add to calendar if user has connected their calendar
      try {
        const eventId = await calendarService.addToGoogleCalendar({
          id: appointment.id,
          consultantId: appointment.consultantId,
          clientId: appointment.clientId,
          scheduledStartTime: appointment.startTime,
          scheduledEndTime: appointment.endTime,
          title: `Legal Consultation`,
          description: appointment.notes,
        }, ''); // TODO: Get client email

        if (eventId) {
          await updateDoc(appointmentRef, {
            'calendarEventIds.google': eventId,
          });
        }
      } catch (error) {
        console.error('Failed to add to calendar:', error);
        // Don't throw error as calendar addition is optional
      }

      // Schedule reminders
      try {
        await reminderService.createReminder({
          type: 'email',
          userId: appointment.clientId,
          sessionId: appointment.id,
          scheduledFor: new Date(appointment.startTime.toDate().getTime() - 24 * 60 * 60 * 1000), // 24 hours before
        });
      } catch (error) {
        console.error('Failed to schedule reminder:', error);
        // Don't throw error as reminder creation is optional
      }

      return appointmentRef.id;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async getAppointment(appointmentId: string): Promise<Appointment | null> {
    try {
      const appointmentDoc = await getDoc(doc(db, this.appointmentsCollection, appointmentId));
      return appointmentDoc.exists() ? (appointmentDoc.data() as Appointment) : null;
    } catch (error) {
      console.error('Error getting appointment:', error);
      throw error;
    }
  }

  async getUpcomingAppointments(userId: string, role: 'consultant' | 'client'): Promise<Appointment[]> {
    try {
      const appointmentsRef = collection(db, this.appointmentsCollection);
      const q = query(
        appointmentsRef,
        where(role === 'consultant' ? 'consultantId' : 'clientId', '==', userId),
        where('status', '==', 'scheduled'),
        where('startTime', '>=', Timestamp.now()),
        orderBy('startTime', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data() } as Appointment));
    } catch (error) {
      console.error('Error getting upcoming appointments:', error);
      throw error;
    }
  }

  async getPastAppointments(userId: string, role: 'consultant' | 'client'): Promise<Appointment[]> {
    try {
      const appointmentsRef = collection(db, this.appointmentsCollection);
      const q = query(
        appointmentsRef,
        where(role === 'consultant' ? 'consultantId' : 'clientId', '==', userId),
        where('status', 'in', ['completed', 'cancelled', 'no-show']),
        orderBy('startTime', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data() } as Appointment));
    } catch (error) {
      console.error('Error getting past appointments:', error);
      throw error;
    }
  }

  async updateAppointment(appointmentId: string, data: Partial<Appointment>): Promise<void> {
    try {
      const appointmentRef = doc(db, this.appointmentsCollection, appointmentId);
      await updateDoc(appointmentRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      // Update calendar event if time changed
      if (data.startTime || data.endTime) {
        const appointment = await this.getAppointment(appointmentId);
        if (appointment?.calendarEventIds?.google) {
          try {
            await calendarService.removeFromCalendar({
              id: appointment.id,
              consultantId: appointment.consultantId,
              clientId: appointment.clientId,
              scheduledStartTime: appointment.startTime,
              scheduledEndTime: appointment.endTime,
            }, 'google');
          } catch (error) {
            console.error('Failed to remove old calendar event:', error);
          }

          try {
            const eventId = await calendarService.addToGoogleCalendar({
              id: appointment.id,
              consultantId: appointment.consultantId,
              clientId: appointment.clientId,
              scheduledStartTime: data.startTime || appointment.startTime,
              scheduledEndTime: data.endTime || appointment.endTime,
              title: `Legal Consultation`,
              description: data.notes || appointment.notes,
            }, ''); // TODO: Get client email

            if (eventId) {
              await updateDoc(appointmentRef, {
                'calendarEventIds.google': eventId,
              });
            }
          } catch (error) {
            console.error('Failed to add new calendar event:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      const appointmentRef = doc(db, this.appointmentsCollection, appointmentId);
      const appointment = await this.getAppointment(appointmentId);

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Remove from calendar
      if (appointment.calendarEventIds?.google) {
        try {
          await calendarService.removeFromCalendar({
            id: appointment.id,
            consultantId: appointment.consultantId,
            clientId: appointment.clientId,
            scheduledStartTime: appointment.startTime,
            scheduledEndTime: appointment.endTime,
          }, 'google');
        } catch (error) {
          console.error('Failed to remove calendar event:', error);
        }
      }

      // Update appointment status
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });

      // Send cancellation notifications
      try {
        // TODO: Get user emails and send cancellation notifications
        await sendEmail({
          to: '', // TODO: Get consultant email
          subject: 'Appointment Cancelled',
          template: 'appointment-cancelled',
          data: {
            appointmentId: appointment.id,
            startTime: appointment.startTime.toDate(),
            endTime: appointment.endTime.toDate(),
          },
        });
      } catch (error) {
        console.error('Failed to send cancellation notification:', error);
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  async createAppointmentType(data: Omit<AppointmentType, 'id'>): Promise<string> {
    try {
      const typeRef = doc(collection(db, this.appointmentTypesCollection));
      const appointmentType: AppointmentType = {
        ...data,
        id: typeRef.id,
      };

      await setDoc(typeRef, appointmentType);
      return typeRef.id;
    } catch (error) {
      console.error('Error creating appointment type:', error);
      throw error;
    }
  }

  async getAppointmentTypes(consultantId: string): Promise<AppointmentType[]> {
    try {
      const typesRef = collection(db, this.appointmentTypesCollection);
      const q = query(
        typesRef,
        where('consultantId', '==', consultantId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data() } as AppointmentType));
    } catch (error) {
      console.error('Error getting appointment types:', error);
      throw error;
    }
  }

  async updateAppointmentType(typeId: string, data: Partial<AppointmentType>): Promise<void> {
    try {
      const typeRef = doc(db, this.appointmentTypesCollection, typeId);
      await updateDoc(typeRef, data);
    } catch (error) {
      console.error('Error updating appointment type:', error);
      throw error;
    }
  }

  async deleteAppointmentType(typeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.appointmentTypesCollection, typeId));
    } catch (error) {
      console.error('Error deleting appointment type:', error);
      throw error;
    }
  }

  async createRecurringAppointment(
    appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    pattern: RecurringPattern
  ): Promise<string[]> {
    try {
      // Create recurring pattern document
      const patternRef = doc(collection(db, this.recurringPatternsCollection));
      await setDoc(patternRef, {
        ...pattern,
        createdAt: serverTimestamp(),
      });

      const appointments: string[] = [];
      let currentDate = appointmentData.startTime.toDate();
      let count = 0;

      while (
        (!pattern.endDate || currentDate <= pattern.endDate) &&
        (!pattern.occurrences || count < pattern.occurrences)
      ) {
        if (pattern.daysOfWeek && !pattern.daysOfWeek.includes(currentDate.getDay())) {
          currentDate = addDays(currentDate, 1);
          continue;
        }

        const startTime = Timestamp.fromDate(currentDate);
        const endTime = Timestamp.fromDate(
          addMinutes(currentDate, differenceInMinutes(
            appointmentData.endTime.toDate(),
            appointmentData.startTime.toDate()
          ))
        );

        const appointmentId = await this.createAppointment({
          ...appointmentData,
          startTime,
          endTime,
          recurringPatternId: patternRef.id,
          isRecurring: true,
        });

        appointments.push(appointmentId);
        count++;

        switch (pattern.frequency) {
          case 'daily':
            currentDate = addDays(currentDate, pattern.interval);
            break;
          case 'weekly':
            currentDate = addWeeks(currentDate, pattern.interval);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, pattern.interval);
            break;
        }
      }

      return appointments;
    } catch (error) {
      console.error('Error creating recurring appointment:', error);
      throw error;
    }
  }

  async cancelRecurringAppointments(patternId: string): Promise<void> {
    try {
      const appointmentsRef = collection(db, this.appointmentsCollection);
      const q = query(
        appointmentsRef,
        where('recurringPatternId', '==', patternId),
        where('status', '==', 'scheduled')
      );

      const snapshot = await getDocs(q);
      const cancelPromises = snapshot.docs.map(doc =>
        this.cancelAppointment(doc.id)
      );

      await Promise.all(cancelPromises);
      await deleteDoc(doc(db, this.recurringPatternsCollection, patternId));
    } catch (error) {
      console.error('Error cancelling recurring appointments:', error);
      throw error;
    }
  }

  async setConsultantAvailability(availability: Omit<ConsultantAvailability, 'id'>): Promise<string> {
    try {
      const availabilityRef = doc(collection(db, this.availabilityCollection));
      const availabilityData: ConsultantAvailability = {
        ...availability,
        id: availabilityRef.id,
      };

      await setDoc(availabilityRef, availabilityData);
      return availabilityRef.id;
    } catch (error) {
      console.error('Error setting consultant availability:', error);
      throw error;
    }
  }

  async getConsultantAvailability(consultantId: string): Promise<ConsultantAvailability | null> {
    try {
      const q = query(
        collection(db, this.availabilityCollection),
        where('consultantId', '==', consultantId),
        limit(1)
      );

      const snapshot = await getDocs(q);
      return snapshot.empty ? null : (snapshot.docs[0].data() as ConsultantAvailability);
    } catch (error) {
      console.error('Error getting consultant availability:', error);
      throw error;
    }
  }

  async getAvailableTimeSlots(consultantId: string, date: Date): Promise<TimeSlot[]> {
    try {
      const availability = await this.getConsultantAvailability(consultantId);
      if (!availability) {
        return [];
      }

      const dayOfWeek = date.getDay();
      const daySchedule = availability.weeklySchedule[dayOfWeek];
      
      if (!daySchedule) {
        return []; // Consultant doesn't work on this day
      }

      // Check for exceptions
      const dateString = format(date, 'yyyy-MM-dd');
      const exception = availability.exceptions.find(e => e.date === dateString);
      
      if (exception) {
        if (!exception.available) {
          return []; // Day is marked as unavailable
        }
        if (exception.customHours) {
          daySchedule.start = exception.customHours.start;
          daySchedule.end = exception.customHours.end;
        }
      }

      // Generate time slots
      const slots: TimeSlot[] = [];
      let currentTime = parse(daySchedule.start, 'HH:mm', date);
      const endTime = parse(daySchedule.end, 'HH:mm', date);

      while (currentTime < endTime) {
        const slotEnd = addMinutes(currentTime, 30); // 30-minute slots
        
        if (daySchedule.breakStart && daySchedule.breakEnd) {
          const breakStart = parse(daySchedule.breakStart, 'HH:mm', date);
          const breakEnd = parse(daySchedule.breakEnd, 'HH:mm', date);
          
          if (!(currentTime >= breakStart && currentTime < breakEnd)) {
            slots.push({
              start: currentTime,
              end: slotEnd,
              available: true,
            });
          }
        } else {
          slots.push({
            start: currentTime,
            end: slotEnd,
            available: true,
          });
        }
        
        currentTime = slotEnd;
      }

      // Check existing appointments
      const appointmentsRef = collection(db, this.appointmentsCollection);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const q = query(
        appointmentsRef,
        where('consultantId', '==', consultantId),
        where('status', '==', 'scheduled'),
        where('startTime', '>=', Timestamp.fromDate(dayStart)),
        where('startTime', '<=', Timestamp.fromDate(dayEnd))
      );

      const snapshot = await getDocs(q);
      const bookedSlots = snapshot.docs.map(doc => doc.data() as Appointment);

      // Mark booked slots as unavailable
      slots.forEach(slot => {
        const isBooked = bookedSlots.some(appointment => {
          const appointmentStart = appointment.startTime.toDate();
          const appointmentEnd = appointment.endTime.toDate();
          return (
            (slot.start >= appointmentStart && slot.start < appointmentEnd) ||
            (slot.end > appointmentStart && slot.end <= appointmentEnd)
          );
        });
        if (isBooked) {
          slot.available = false;
        }
      });

      // Apply buffer between appointments
      if (availability.bufferBetweenAppointments > 0) {
        slots.forEach((slot, index) => {
          if (!slot.available) {
            // Mark buffer slots as unavailable
            const bufferSlots = Math.ceil(availability.bufferBetweenAppointments / 30);
            for (let i = 1; i <= bufferSlots; i++) {
              if (index - i >= 0) slots[index - i].available = false;
              if (index + i < slots.length) slots[index + i].available = false;
            }
          }
        });
      }

      return slots;
    } catch (error) {
      console.error('Error getting available time slots:', error);
      throw error;
    }
  }
}

const appointmentService = new AppointmentService();
export default appointmentService;
