import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import appointmentService, { Appointment, TimeSlot } from '../../services/AppointmentService';

interface RescheduleDialogProps {
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
  onReschedule: () => void;
}

const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  open,
  appointment,
  onClose,
  onReschedule,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots();
    }
  }, [selectedDate]);

  const loadTimeSlots = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const slots = await appointmentService.getAvailableTimeSlots(
        appointment.consultantId,
        selectedDate
      );
      setTimeSlots(slots);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error loading time slots:', error);
      setError('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;

    setLoading(true);
    try {
      await appointmentService.updateAppointment(appointment.id, {
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
      });
      onReschedule();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      setError('Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedSlot(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Reschedule Appointment</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="subtitle1" gutterBottom>
            Current Appointment:
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {format(appointment.startTime.toDate(), 'PPP')} at{' '}
            {format(appointment.startTime.toDate(), 'p')}
          </Typography>

          <Box sx={{ my: 3 }}>
            <DatePicker
              label="Select New Date"
              value={selectedDate}
              onChange={setSelectedDate}
              disablePast
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : selectedDate ? (
            timeSlots.length > 0 ? (
              <Grid container spacing={1}>
                {timeSlots.map((slot, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <Button
                      variant={selectedSlot === slot ? 'contained' : 'outlined'}
                      disabled={!slot.available}
                      fullWidth
                      onClick={() => setSelectedSlot(slot)}
                      sx={{ textTransform: 'none' }}
                    >
                      {format(slot.start, 'p')}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary" align="center">
                No available time slots for this date
              </Typography>
            )
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleReschedule}
          disabled={!selectedSlot || loading}
        >
          Reschedule
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RescheduleDialog;
