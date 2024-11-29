import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { format, parse } from 'date-fns';
import appointmentService, { ConsultantAvailability } from '../../services/AppointmentService';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface AvailabilityManagerProps {
  consultantId: string;
}

const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({
  consultantId,
}) => {
  const [availability, setAvailability] = useState<ConsultantAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [exceptionDate, setExceptionDate] = useState<Date | null>(null);

  useEffect(() => {
    loadAvailability();
  }, [consultantId]);

  const loadAvailability = async () => {
    try {
      const data = await appointmentService.getConsultantAvailability(consultantId);
      setAvailability(data || {
        id: '',
        consultantId,
        weeklySchedule: {},
        exceptions: [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        bufferBetweenAppointments: 15,
        maxAdvanceBooking: 60,
        minNoticeBooking: 24,
      });
    } catch (error) {
      console.error('Error loading availability:', error);
      setError('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!availability) return;

    try {
      await appointmentService.setConsultantAvailability(availability);
      setError(null);
    } catch (error) {
      console.error('Error saving availability:', error);
      setError('Failed to save availability settings');
    }
  };

  const handleAddSchedule = (day: number) => {
    setSelectedDay(day);
    setOpenDialog(true);
  };

  const handleSaveSchedule = (start: Date, end: Date, breakStart?: Date, breakEnd?: Date) => {
    if (!availability || selectedDay === null) return;

    setAvailability(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        weeklySchedule: {
          ...prev.weeklySchedule,
          [selectedDay]: {
            start: format(start, 'HH:mm'),
            end: format(end, 'HH:mm'),
            ...(breakStart && breakEnd && {
              breakStart: format(breakStart, 'HH:mm'),
              breakEnd: format(breakEnd, 'HH:mm'),
            }),
          },
        },
      };
    });

    setOpenDialog(false);
    setSelectedDay(null);
  };

  const handleRemoveSchedule = (day: number) => {
    if (!availability) return;

    setAvailability(prev => {
      if (!prev) return prev;

      const { [day]: _, ...rest } = prev.weeklySchedule;
      return {
        ...prev,
        weeklySchedule: rest,
      };
    });
  };

  const handleAddException = (date: Date, available: boolean, customHours?: { start: string; end: string }) => {
    if (!availability) return;

    setAvailability(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        exceptions: [
          ...prev.exceptions,
          {
            date: format(date, 'yyyy-MM-dd'),
            available,
            customHours,
          },
        ],
      };
    });

    setExceptionDate(null);
  };

  const handleRemoveException = (date: string) => {
    if (!availability) return;

    setAvailability(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        exceptions: prev.exceptions.filter(e => e.date !== date),
      };
    });
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!availability) {
    return <Typography color="error">Failed to load availability settings</Typography>;
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Weekly Schedule */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Schedule
            </Typography>
            <Grid container spacing={2}>
              {DAYS_OF_WEEK.map((day) => (
                <Grid item xs={12} key={day.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ width: 100 }}>{day.label}</Typography>
                    {availability.weeklySchedule[day.value] ? (
                      <>
                        <Typography>
                          {availability.weeklySchedule[day.value].start} -{' '}
                          {availability.weeklySchedule[day.value].end}
                          {availability.weeklySchedule[day.value].breakStart && (
                            <span>
                              {' '}
                              (Break: {availability.weeklySchedule[day.value].breakStart} -{' '}
                              {availability.weeklySchedule[day.value].breakEnd})
                            </span>
                          )}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleAddSchedule(day.value)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveSchedule(day.value)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    ) : (
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleAddSchedule(day.value)}
                      >
                        Add Hours
                      </Button>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Exceptions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Exceptions
            </Typography>
            <Box sx={{ mb: 2 }}>
              <DatePicker
                label="Add Exception"
                value={exceptionDate}
                onChange={setExceptionDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availability.exceptions.map((exception) => (
                <Chip
                  key={exception.date}
                  label={`${exception.date} - ${exception.available ? 'Available' : 'Unavailable'}`}
                  onDelete={() => handleRemoveException(exception.date)}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Buffer Between Appointments (minutes)"
                  value={availability.bufferBetweenAppointments}
                  onChange={(e) =>
                    setAvailability(prev => ({
                      ...prev!,
                      bufferBetweenAppointments: parseInt(e.target.value),
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Advance Booking (days)"
                  value={availability.maxAdvanceBooking}
                  onChange={(e) =>
                    setAvailability(prev => ({
                      ...prev!,
                      maxAdvanceBooking: parseInt(e.target.value),
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Notice Required (hours)"
                  value={availability.minNoticeBooking}
                  onChange={(e) =>
                    setAvailability(prev => ({
                      ...prev!,
                      minNoticeBooking: parseInt(e.target.value),
                    }))
                  }
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Add/Edit Schedule Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedDay !== null && `Set Hours for ${DAYS_OF_WEEK[selectedDay].label}`}
        </DialogTitle>
        <DialogContent>
          <ScheduleForm
            initialData={selectedDay !== null ? availability.weeklySchedule[selectedDay] : undefined}
            onSubmit={handleSaveSchedule}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

interface ScheduleFormProps {
  initialData?: {
    start: string;
    end: string;
    breakStart?: string;
    breakEnd?: string;
  };
  onSubmit: (start: Date, end: Date, breakStart?: Date, breakEnd?: Date) => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({
  initialData,
  onSubmit,
}) => {
  const [start, setStart] = useState<Date | null>(
    initialData?.start ? parse(initialData.start, 'HH:mm', new Date()) : null
  );
  const [end, setEnd] = useState<Date | null>(
    initialData?.end ? parse(initialData.end, 'HH:mm', new Date()) : null
  );
  const [hasBreak, setHasBreak] = useState(!!initialData?.breakStart);
  const [breakStart, setBreakStart] = useState<Date | null>(
    initialData?.breakStart ? parse(initialData.breakStart, 'HH:mm', new Date()) : null
  );
  const [breakEnd, setBreakEnd] = useState<Date | null>(
    initialData?.breakEnd ? parse(initialData.breakEnd, 'HH:mm', new Date()) : null
  );

  const handleSubmit = () => {
    if (!start || !end) return;
    onSubmit(start, end, hasBreak ? breakStart || undefined : undefined, hasBreak ? breakEnd || undefined : undefined);
  };

  return (
    <Box sx={{ pt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <TimePicker
            label="Start Time"
            value={start}
            onChange={setStart}
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TimePicker
            label="End Time"
            value={end}
            onChange={setEnd}
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            onClick={() => setHasBreak(!hasBreak)}
          >
            {hasBreak ? 'Remove Break' : 'Add Break'}
          </Button>
        </Grid>

        {hasBreak && (
          <>
            <Grid item xs={6}>
              <TimePicker
                label="Break Start"
                value={breakStart}
                onChange={setBreakStart}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TimePicker
                label="Break End"
                value={breakEnd}
                onChange={setBreakEnd}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleSubmit}>
              Save
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AvailabilityManager;
