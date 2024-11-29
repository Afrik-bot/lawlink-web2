import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import {
  addDays,
  format,
  parse,
  startOfDay,
  endOfDay,
  eachHourOfInterval,
  isWithinInterval,
  addMinutes,
} from 'date-fns';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ConsultantProfile } from '../../services/ConsultantService';
import { useAuth } from '../../contexts/AuthContext';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

interface BookingCalendarProps {
  consultant: ConsultantProfile;
  onClose: () => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ consultant, onClose }) => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(consultant.availability.defaultSessionDuration);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      loadAvailability();
    }
  }, [selectedDate]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query existing bookings for the selected date
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('consultantId', '==', consultant.id),
        where('date', '>=', startOfDay(selectedDate)),
        where('date', '<=', endOfDay(selectedDate))
      );

      const snapshot = await getDocs(q);
      const existingBookings = snapshot.docs.map(doc => ({
        start: doc.data().date.toDate(),
        end: doc.data().endDate.toDate(),
      }));

      // Generate time slots
      const businessHours = {
        start: 9, // 9 AM
        end: 17, // 5 PM
      };

      const slots: TimeSlot[] = [];
      const hours = eachHourOfInterval({
        start: addMinutes(startOfDay(selectedDate), businessHours.start * 60),
        end: addMinutes(startOfDay(selectedDate), businessHours.end * 60),
      });

      hours.forEach(hour => {
        const slotEnd = addMinutes(hour, duration);
        const isAvailable = !existingBookings.some(booking =>
          isWithinInterval(hour, { start: booking.start, end: booking.end }) ||
          isWithinInterval(slotEnd, { start: booking.start, end: booking.end })
        );

        slots.push({
          start: hour,
          end: slotEnd,
          available: isAvailable,
        });
      });

      setTimeSlots(slots);
    } catch (err) {
      console.error('Error loading availability:', err);
      setError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!currentUser || !selectedTime) return;

    try {
      setLoading(true);
      setError(null);

      const startTime = parse(selectedTime, 'HH:mm', selectedDate);
      const endTime = addMinutes(startTime, duration);

      // Create booking
      await addDoc(collection(db, 'bookings'), {
        consultantId: consultant.id,
        userId: currentUser.uid,
        date: startTime,
        endDate: endTime,
        duration,
        notes,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTitle>
        Book Consultation with {consultant.personalInfo.firstName} {consultant.personalInfo.lastName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Booking successful! The consultant will confirm your appointment.
          </Alert>
        )}

        {!currentUser && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please sign in to book a consultation
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                value={selectedDate}
                onChange={(newDate) => {
                  if (newDate) {
                    setSelectedDate(newDate);
                    setSelectedTime('');
                  }
                }}
                minDate={new Date()}
                maxDate={addDays(new Date(), 30)}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Available Times
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {timeSlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant={selectedTime === format(slot.start, 'HH:mm') ? 'contained' : 'outlined'}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(format(slot.start, 'HH:mm'))}
                    size="small"
                  >
                    {format(slot.start, 'h:mm a')}
                  </Button>
                ))}
              </Box>
            )}

            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Duration</InputLabel>
                <Select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  label="Duration"
                >
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={60}>1 hour</MenuItem>
                  <MenuItem value={90}>1.5 hours</MenuItem>
                  <MenuItem value={120}>2 hours</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Notes for the consultant"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                helperText="Briefly describe your legal matter. Do not include sensitive information."
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleBooking}
          disabled={!currentUser || !selectedTime || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Book Consultation'}
        </Button>
      </DialogActions>
    </>
  );
};

export default BookingCalendar;
