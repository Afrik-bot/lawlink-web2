import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  TextFieldProps,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addMinutes, isAfter, isBefore, startOfDay } from 'date-fns';
import appointmentService, { AppointmentType, TimeSlot } from '../../services/AppointmentService';

interface AppointmentSchedulerProps {
  consultantId: string;
  userId: string;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  consultantId,
  userId
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointmentTypes();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadAppointmentTypes = async () => {
    try {
      const types = await appointmentService.getAppointmentTypes(consultantId);
      setAppointmentTypes(types);
    } catch (error) {
      console.error('Failed to load appointment types:', error);
      setError('Failed to load appointment types');
    }
  };

  const loadTimeSlots = async (date: Date) => {
    setLoading(true);
    try {
      const slots = await appointmentService.getAvailableTimeSlots(consultantId, date);
      setTimeSlots(slots);
    } catch (error) {
      console.error('Failed to load time slots:', error);
      setError('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setDialogOpen(true);
  };

  const handleScheduleAppointment = async () => {
    if (!selectedSlot || !selectedType) return;

    try {
      await appointmentService.createAppointment({
        consultantId,
        clientId: userId,
        appointmentTypeId: selectedType,
        startTime: Timestamp.fromDate(selectedSlot.start),
        endTime: Timestamp.fromDate(selectedSlot.end),
        notes
      });

      setDialogOpen(false);
      setSelectedSlot(null);
      setNotes('');
      loadTimeSlots(selectedDate!);
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
      setError('Failed to schedule appointment');
    }
  };

  const renderTimeSlots = () => {
    if (!timeSlots.length) {
      return (
        <Typography color="text.secondary" sx={{ p: 2 }}>
          No available time slots for this date
        </Typography>
      );
    }

    return (
      <Grid container spacing={1} sx={{ p: 2 }}>
        {timeSlots.map((slot, index) => (
          <Grid item xs={6} sm={4} md={3} key={index}>
            <Button
              variant={selectedSlot === slot ? 'contained' : 'outlined'}
              fullWidth
              disabled={!slot.available}
              onClick={() => handleSlotSelect(slot)}
            >
              {format(slot.start, 'h:mm a')}
            </Button>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={setSelectedDate}
                disablePast
                slots={{
                  textField: (params: TextFieldProps) => <TextField {...params} fullWidth />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Appointment Type</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="Appointment Type"
                >
                  {appointmentTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name} - {type.duration} min (${type.price})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <Paper>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>Loading available time slots...</Typography>
            </Box>
          ) : (
            renderTimeSlots()
          )}
        </Paper>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Selected Time:{' '}
                {selectedSlot &&
                  `${format(selectedSlot.start, 'h:mm a')} - ${format(
                    selectedSlot.end,
                    'h:mm a'
                  )}`}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mt: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleScheduleAppointment}
              variant="contained"
              disabled={!selectedType}
            >
              Schedule
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AppointmentScheduler;
