import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  VideoCall as VideoCallIcon,
  Message as MessageIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import appointmentService, { Appointment } from '../services/AppointmentService';

const Appointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = async () => {
    try {
      if (!user?.uid || !user?.role) return;

      const [upcoming, past] = await Promise.all([
        appointmentService.getUpcomingAppointments(user.uid, user.role),
        appointmentService.getPastAppointments(user.uid, user.role)
      ]);

      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (err) {
      setError('Failed to load appointments');
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await appointmentService.cancelAppointment(appointmentId);
      await loadAppointments();
    } catch (err) {
      setError('Failed to cancel appointment');
      console.error('Error canceling appointment:', err);
    }
  };

  const handleJoinMeeting = (appointmentId: string) => {
    navigate(`/live-stream/room/${appointmentId}`);
  };

  const handleMessage = (userId: string) => {
    navigate(`/messages?userId=${userId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
          <Typography>{error}</Typography>
          <Button onClick={loadAppointments} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Appointments
        </Typography>
        {user?.role === 'client' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/search-consultants')}
          >
            Book Consultation
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Upcoming Appointments */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Upcoming Appointments
          </Typography>
          {upcomingAppointments.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No upcoming appointments
              </Typography>
              {user?.role === 'client' && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/search-consultants')}
                  sx={{ mt: 2 }}
                >
                  Book a Consultation
                </Button>
              )}
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {upcomingAppointments.map((appointment) => (
                <Grid item xs={12} md={6} key={appointment.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {format(appointment.startTime.toDate(), 'PPP')}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {format(appointment.startTime.toDate(), 'p')} - {format(appointment.endTime.toDate(), 'p')}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" paragraph>
                        {appointment.notes || 'No additional notes'}
                      </Typography>
                      <Chip
                        label={appointment.status}
                        color={appointment.status === 'scheduled' ? 'primary' : 'default'}
                        size="small"
                      />
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<VideoCallIcon />}
                        onClick={() => handleJoinMeeting(appointment.id)}
                      >
                        Join Meeting
                      </Button>
                      <Button
                        size="small"
                        startIcon={<MessageIcon />}
                        onClick={() => handleMessage(user?.role === 'client' ? appointment.consultantId : appointment.clientId)}
                      >
                        Message
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleCancelAppointment(appointment.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Past Appointments */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Past Appointments
          </Typography>
          {pastAppointments.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No past appointments
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {pastAppointments.map((appointment) => (
                <Grid item xs={12} md={6} key={appointment.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {format(appointment.startTime.toDate(), 'PPP')}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {format(appointment.startTime.toDate(), 'p')} - {format(appointment.endTime.toDate(), 'p')}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" paragraph>
                        {appointment.notes || 'No additional notes'}
                      </Typography>
                      <Chip
                        label={appointment.status}
                        color="default"
                        size="small"
                      />
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<MessageIcon />}
                        onClick={() => handleMessage(user?.role === 'client' ? appointment.consultantId : appointment.clientId)}
                      >
                        Message
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Appointments;
