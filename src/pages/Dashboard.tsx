import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Event as EventIcon,
  Message as MessageIcon,
  Description as DocumentIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Appointment } from '../services/AppointmentService';
import appointmentService from '../services/AppointmentService';
import messageService from '../services/MessageService';

interface DashboardData {
  upcomingAppointments: Appointment[];
  unreadMessages: number;
  loading: boolean;
  error: string | null;
}

const ClientDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    upcomingAppointments: [],
    unreadMessages: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.uid) return;

      try {
        // Load upcoming appointments
        const appointments = await appointmentService.getUpcomingAppointments(user.uid);
        
        // Get unread message count from conversations
        const conversations = await messageService.getConversations(user.uid);
        const unreadCount = conversations.reduce((total, conv) => 
          total + (conv.unreadCount[user.uid] || 0), 0);

        setDashboardData({
          upcomingAppointments: appointments,
          unreadMessages: unreadCount,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data',
        }));
      }
    };

    loadDashboardData();
  }, [user]);

  if (dashboardData.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (dashboardData.error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
        <Typography>{dashboardData.error}</Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Quick Actions */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => navigate('/search-consultants')}
              >
                Find Consultant
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ScheduleIcon />}
                onClick={() => navigate('/appointments')}
              >
                Book Consultation
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<VideoCallIcon />}
                onClick={() => navigate('/live-stream')}
              >
                Live Consultation
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<MessageIcon />}
                onClick={() => navigate('/messages')}
              >
                Messages {dashboardData.unreadMessages > 0 && `(${dashboardData.unreadMessages})`}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Upcoming Appointments */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upcoming Appointments
            </Typography>
            <List>
              {dashboardData.upcomingAppointments.length > 0 ? (
                dashboardData.upcomingAppointments.slice(0, 3).map((appointment) => (
                  <ListItem key={appointment.id}>
                    <ListItemIcon>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${appointment.consultantName} - ${new Date(appointment.startTime).toLocaleString()}`}
                      secondary={appointment.status}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemIcon>
                    <EventIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="No upcoming appointments"
                    secondary="Click 'Book Consultation' to schedule one"
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/appointments')}>
              View All
            </Button>
          </CardActions>
        </Card>
      </Grid>

      {/* Recent Messages */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Messages {dashboardData.unreadMessages > 0 && 
                <Typography component="span" color="primary">
                  ({dashboardData.unreadMessages} unread)
                </Typography>
              }
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <MessageIcon />
                </ListItemIcon>
                <ListItemText
                  primary={dashboardData.unreadMessages > 0 
                    ? `You have ${dashboardData.unreadMessages} unread message${dashboardData.unreadMessages > 1 ? 's' : ''}`
                    : "No unread messages"
                  }
                  secondary="Click 'View All' to see your conversations"
                />
              </ListItem>
            </List>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/messages')}>
              View All
            </Button>
          </CardActions>
        </Card>
      </Grid>
    </Grid>
  );
};

const ConsultantDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    upcomingAppointments: [],
    unreadMessages: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.uid) return;

      try {
        // Load today's appointments
        const appointments = await appointmentService.getConsultantAppointments(user.uid);
        
        // Get unread message count
        const conversations = await messageService.getConversations(user.uid);
        const unreadCount = conversations.reduce((total, conv) => 
          total + (conv.unreadCount[user.uid] || 0), 0);

        setDashboardData({
          upcomingAppointments: appointments,
          unreadMessages: unreadCount,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data',
        }));
      }
    };

    loadDashboardData();
  }, [user]);

  if (dashboardData.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (dashboardData.error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
        <Typography>{dashboardData.error}</Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Quick Actions */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ScheduleIcon />}
                onClick={() => navigate('/availability')}
              >
                Set Availability
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<MessageIcon />}
                onClick={() => navigate('/messages')}
              >
                Messages {dashboardData.unreadMessages > 0 && `(${dashboardData.unreadMessages})`}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<DocumentIcon />}
                onClick={() => navigate('/documents')}
              >
                Documents
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<PersonIcon />}
                onClick={() => navigate('/profile')}
              >
                Edit Profile
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Today's Schedule */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Today's Schedule
            </Typography>
            <List>
              {dashboardData.upcomingAppointments.length > 0 ? (
                dashboardData.upcomingAppointments.slice(0, 3).map((appointment) => (
                  <ListItem key={appointment.id}>
                    <ListItemIcon>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${appointment.clientName} - ${new Date(appointment.startTime).toLocaleString()}`}
                      secondary={appointment.status}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemIcon>
                    <EventIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="No appointments today"
                    secondary="Your schedule is clear"
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/schedule')}>
              View Full Schedule
            </Button>
          </CardActions>
        </Card>
      </Grid>

      {/* Messages */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Messages {dashboardData.unreadMessages > 0 && 
                <Typography component="span" color="primary">
                  ({dashboardData.unreadMessages} unread)
                </Typography>
              }
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <MessageIcon />
                </ListItemIcon>
                <ListItemText
                  primary={dashboardData.unreadMessages > 0 
                    ? `You have ${dashboardData.unreadMessages} unread message${dashboardData.unreadMessages > 1 ? 's' : ''}`
                    : "No unread messages"
                  }
                  secondary="Click 'View All' to see your conversations"
                />
              </ListItem>
            </List>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/messages')}>
              View All
            </Button>
          </CardActions>
        </Card>
      </Grid>
    </Grid>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  // If no role is set, show a message and button to set role
  if (!user?.role) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Welcome to LawLink!
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Please select your role to continue
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/client-signup')}
            >
              I need legal consultation
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/consultant-signup')}
            >
              I am a legal consultant
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Welcome, {user?.firstName || user?.displayName || 'User'}!
        </Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {user?.role === 'client' ? <ClientDashboard /> : <ConsultantDashboard />}
    </Container>
  );
};

export default Dashboard;
