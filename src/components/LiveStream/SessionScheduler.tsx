import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Grid,
  Paper,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addHours } from 'date-fns';
import {
  VideoCall,
  Cancel,
  Edit,
  Delete,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import sessionService, { SessionSchedule } from '../../services/SessionService';
import { useNavigate } from 'react-router-dom';

interface SessionSchedulerProps {
  userRole: 'consultant' | 'client';
  onSessionScheduled?: () => void;
}

export default function SessionScheduler({ userRole, onSessionScheduled }: SessionSchedulerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionSchedule[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(new Date());
  const [endTime, setEndTime] = useState<Date | null>(addHours(new Date(), 1));
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    loadUpcomingSessions();
    if (userRole === 'consultant') {
      loadClients();
    }
  }, [user, userRole]);

  const loadUpcomingSessions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const sessions = await sessionService.getUpcomingSessions(user.uid, userRole);
      setUpcomingSessions(sessions);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load upcoming sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    // TODO: Implement client loading from your user service
    // This is a placeholder
    setClients([
      { id: 'client1', name: 'John Doe' },
      { id: 'client2', name: 'Jane Smith' },
    ]);
  };

  const handleScheduleSession = async () => {
    if (!user || !startTime || !endTime || !title) return;
    
    try {
      setLoading(true);
      setError(null);

      await sessionService.scheduleSession(
        userRole === 'consultant' ? user.uid : selectedClient,
        userRole === 'client' ? user.uid : selectedClient,
        startTime,
        endTime,
        title,
        description
      );

      setIsDialogOpen(false);
      loadUpcomingSessions();
      onSessionScheduled?.();
    } catch (err) {
      console.error('Error scheduling session:', err);
      setError('Failed to schedule session');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (session: SessionSchedule) => {
    try {
      setLoading(true);
      setError(null);

      const roomId = await sessionService.startScheduledSession(session.id);
      navigate(`/consultation/${roomId}`);
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (session: SessionSchedule) => {
    try {
      setLoading(true);
      setError(null);

      await sessionService.cancelSession(session.id, 'Cancelled by user');
      loadUpcomingSessions();
    } catch (err) {
      console.error('Error cancelling session:', err);
      setError('Failed to cancel session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%', p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Upcoming Consultations</Typography>
          {userRole === 'consultant' && (
            <Button
              variant="contained"
              startIcon={<Schedule />}
              onClick={() => setIsDialogOpen(true)}
            >
              Schedule Consultation
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {upcomingSessions.map((session) => (
              <Grid item xs={12} key={session.id}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{session.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(session.scheduledStartTime.toDate(), 'PPp')} -{' '}
                        {format(session.scheduledEndTime.toDate(), 'p')}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {session.status === 'scheduled' && userRole === 'consultant' && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<VideoCall />}
                          onClick={() => handleStartSession(session)}
                        >
                          Start Session
                        </Button>
                      )}
                      {session.status === 'scheduled' && (
                        <IconButton
                          color="error"
                          onClick={() => handleCancelSession(session)}
                        >
                          <Cancel />
                        </IconButton>
                      )}
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            ))}
            {upcomingSessions.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No upcoming consultations scheduled
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {/* Schedule Session Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Schedule Legal Consultation</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
              <FormControl fullWidth required>
                <InputLabel>Client</InputLabel>
                <Select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  label="Client"
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <DateTimePicker
                label="Start Time"
                value={startTime}
                onChange={setStartTime}
                sx={{ width: '100%' }}
              />
              <DateTimePicker
                label="End Time"
                value={endTime}
                onChange={setEndTime}
                sx={{ width: '100%' }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleScheduleSession}
              variant="contained"
              disabled={!title || !startTime || !endTime || !selectedClient}
            >
              Schedule
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
