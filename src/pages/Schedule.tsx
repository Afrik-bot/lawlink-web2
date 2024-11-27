import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  FormHelperText,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

interface ScheduleSlot {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  availability: 'available' | 'unavailable';
  breakTime?: {
    start: string;
    end: string;
  };
}

const Schedule = () => {
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Placeholder schedule data
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([
    {
      id: 1,
      day: 'Monday',
      startTime: '09:00',
      endTime: '17:00',
      availability: 'available',
      breakTime: {
        start: '12:00',
        end: '13:00',
      },
    },
    {
      id: 2,
      day: 'Tuesday',
      startTime: '09:00',
      endTime: '17:00',
      availability: 'available',
      breakTime: {
        start: '12:00',
        end: '13:00',
      },
    },
    {
      id: 3,
      day: 'Wednesday',
      startTime: '09:00',
      endTime: '17:00',
      availability: 'unavailable',
    },
    {
      id: 4,
      day: 'Thursday',
      startTime: '09:00',
      endTime: '17:00',
      availability: 'available',
      breakTime: {
        start: '12:00',
        end: '13:00',
      },
    },
    {
      id: 5,
      day: 'Friday',
      startTime: '09:00',
      endTime: '17:00',
      availability: 'available',
      breakTime: {
        start: '12:00',
        end: '13:00',
      },
    },
  ]);

  const handleOpenDialog = (slot: ScheduleSlot | null = null) => {
    setEditingSlot(slot);
    setOpenDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setEditingSlot(null);
    setOpenDialog(false);
    setError(null);
  };

  const validateTimeSlot = (startTime: string, endTime: string, breakStart?: string, breakEnd?: string): boolean => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end <= start) {
      setError('End time must be after start time');
      return false;
    }

    if (breakStart && breakEnd) {
      const breakStartTime = new Date(`2000-01-01T${breakStart}`);
      const breakEndTime = new Date(`2000-01-01T${breakEnd}`);

      if (breakEndTime <= breakStartTime) {
        setError('Break end time must be after break start time');
        return false;
      }

      if (breakStartTime <= start || breakEndTime >= end) {
        setError('Break time must be within working hours');
        return false;
      }
    }

    return true;
  };

  const handleSaveSchedule = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const day = formData.get('day') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const availability = formData.get('availability') as 'available' | 'unavailable';
    const breakStart = formData.get('breakTimeStart') as string;
    const breakEnd = formData.get('breakTimeEnd') as string;

    if (!day || !startTime || !endTime || !availability) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate time slots
    if (!validateTimeSlot(startTime, endTime, breakStart, breakEnd)) {
      return;
    }

    // Check for overlapping schedules
    const hasOverlap = scheduleSlots.some(slot => 
      slot.day === day && slot.id !== editingSlot?.id
    );

    if (hasOverlap) {
      setError('A schedule for this day already exists');
      return;
    }

    const newSlot: ScheduleSlot = {
      id: editingSlot?.id || Date.now(),
      day,
      startTime,
      endTime,
      availability,
      ...(breakStart && breakEnd && {
        breakTime: {
          start: breakStart,
          end: breakEnd,
        },
      }),
    };

    setScheduleSlots(prev => {
      if (editingSlot) {
        return prev.map(slot => slot.id === editingSlot.id ? newSlot : slot);
      }
      return [...prev, newSlot];
    });

    setSuccessMessage(editingSlot ? 'Schedule updated successfully' : 'Schedule added successfully');
    handleCloseDialog();
  };

  const handleDeleteSlot = (slotId: number) => {
    setScheduleSlots(prev => prev.filter(slot => slot.id !== slotId));
    setSuccessMessage('Schedule deleted successfully');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Schedule</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Schedule
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Weekly Schedule */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Schedule
            </Typography>
            <Grid container spacing={2}>
              {scheduleSlots.map((slot) => (
                <Grid item xs={12} sm={6} md={4} key={slot.id}>
                  <Card
                    sx={{
                      bgcolor: slot.availability === 'available'
                        ? 'success.light'
                        : 'error.light',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                          {slot.day}
                        </Typography>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(slot)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteSlot(slot.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="body1">
                        {slot.startTime} - {slot.endTime}
                      </Typography>
                      {slot.breakTime && (
                        <Typography variant="body2" color="text.secondary">
                          Break: {slot.breakTime.start} - {slot.breakTime.end}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        sx={{ mt: 1, textTransform: 'capitalize' }}
                      >
                        Status: {slot.availability}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Schedule Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveSchedule}>
          <DialogTitle>
            {editingSlot ? 'Edit Schedule' : 'Add Schedule'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth error={Boolean(error)}>
                  <TextField
                    select
                    label="Day"
                    name="day"
                    defaultValue={editingSlot?.day || ''}
                    required
                  >
                    <MenuItem value="Monday">Monday</MenuItem>
                    <MenuItem value="Tuesday">Tuesday</MenuItem>
                    <MenuItem value="Wednesday">Wednesday</MenuItem>
                    <MenuItem value="Thursday">Thursday</MenuItem>
                    <MenuItem value="Friday">Friday</MenuItem>
                    <MenuItem value="Saturday">Saturday</MenuItem>
                    <MenuItem value="Sunday">Sunday</MenuItem>
                  </TextField>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Time"
                  name="startTime"
                  defaultValue={editingSlot?.startTime || '09:00'}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="End Time"
                  name="endTime"
                  defaultValue={editingSlot?.endTime || '17:00'}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Availability"
                  name="availability"
                  defaultValue={editingSlot?.availability || 'available'}
                  required
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="unavailable">Unavailable</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Break Time (Optional)
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Break Start"
                  name="breakTimeStart"
                  defaultValue={editingSlot?.breakTime?.start || ''}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Break End"
                  name="breakTimeEnd"
                  defaultValue={editingSlot?.breakTime?.end || ''}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Schedule;
