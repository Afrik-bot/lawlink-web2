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
  ArrowForwardIcon,
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
      if (!user?.uid) {
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'User not authenticated',
        }));
        return;
      }

      try {
        setDashboardData(prev => ({ ...prev, loading: true, error: null }));
        
        // Load data in parallel for better performance
        const [appointments, conversations] = await Promise.all([
          appointmentService.getUpcomingAppointments(user.uid),
          messageService.getConversations(user.uid),
        ]);
        
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
          error: 'Failed to load dashboard data. Please try again later.',
        }));
      }
    };

    loadDashboardData();
  }, [user]);

  if (dashboardData.loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        p: 3,
        minHeight: '50vh'
      }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  if (dashboardData.error) {
    return (
      <Paper sx={{ 
        p: 3, 
        textAlign: 'center', 
        color: 'error.main',
        borderRadius: 2,
        border: `1px solid ${theme.palette.error.main}`,
        bgcolor: theme.palette.error.light + '10'
      }}>
        <Typography variant="h6" gutterBottom>
          {dashboardData.error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Quick Actions */}
      <Grid item xs={12}>
        <Paper sx={{ 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}>
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
                sx={{ py: 1.5 }}
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
                sx={{ py: 1.5 }}
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
                sx={{ py: 1.5 }}
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
                sx={{ py: 1.5 }}
                color={dashboardData.unreadMessages > 0 ? 'secondary' : 'primary'}
              >
                Messages {dashboardData.unreadMessages > 0 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      px: 1,
                      py: 0.5,
                      bgcolor: 'white',
                      color: 'secondary.main',
                      borderRadius: '50%',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {dashboardData.unreadMessages}
                  </Box>
                )}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Upcoming Appointments */}
      <Grid item xs={12} md={6}>
        <Card sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Upcoming Appointments
              </Typography>
            </Box>
            <List>
              {dashboardData.upcomingAppointments.length > 0 ? (
                dashboardData.upcomingAppointments.slice(0, 3).map((appointment) => (
                  <ListItem 
                    key={appointment.id}
                    sx={{
                      mb: 1,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <ListItemIcon>
                      <EventIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {appointment.consultantName}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(appointment.startTime).toLocaleString()}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: getStatusColor(appointment.status),
                              fontWeight: 500
                            }}
                          >
                            {appointment.status}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem sx={{ 
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  <ListItemIcon>
                    <EventIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="No upcoming appointments"
                    secondary={
                      <Button
                        variant="text"
                        color="primary"
                        onClick={() => navigate('/appointments')}
                        sx={{ mt: 1, p: 0 }}
                      >
                        Click here to book a consultation
                      </Button>
                    }
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
          {dashboardData.upcomingAppointments.length > 0 && (
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button 
                size="small" 
                onClick={() => navigate('/appointments')}
                endIcon={<ArrowForwardIcon />}
              >
                View All Appointments
              </Button>
            </CardActions>
          )}
        </Card>
      </Grid>

      {/* Recent Messages */}
      <Grid item xs={12} md={6}>
        <Card sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MessageIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Messages
                {dashboardData.unreadMessages > 0 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      px: 1.5,
                      py: 0.5,
                      bgcolor: 'secondary.main',
                      color: 'white',
                      borderRadius: 'pill',
                      fontSize: '0.75rem',
                    }}
                  >
                    {dashboardData.unreadMessages} new
                  </Box>
                )}
              </Typography>
            </Box>
            <List>
              <ListItem sx={{ 
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
              }}>
                <ListItemIcon>
                  <MessageIcon color="action" />
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
          <CardActions sx={{ p: 2, pt: 0 }}>
            <Button 
              size="small" 
              onClick={() => navigate('/messages')}
              endIcon={<ArrowForwardIcon />}
            >
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
      if (!user?.uid) {
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'User not authenticated',
        }));
        return;
      }

      try {
        setDashboardData(prev => ({ ...prev, loading: true, error: null }));
        
        // Load data in parallel for better performance
        const [appointments, conversations] = await Promise.all([
          appointmentService.getConsultantAppointments(user.uid),
          messageService.getConversations(user.uid),
        ]);
        
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
          error: 'Failed to load dashboard data. Please try again later.',
        }));
      }
    };

    loadDashboardData();
  }, [user]);

  if (dashboardData.loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        p: 3,
        minHeight: '50vh'
      }}>
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  if (dashboardData.error) {
    return (
      <Paper sx={{ 
        p: 3, 
        textAlign: 'center', 
        color: 'error.main',
        borderRadius: 2,
        border: `1px solid ${theme.palette.error.main}`,
        bgcolor: theme.palette.error.light + '10'
      }}>
        <Typography variant="h6" gutterBottom>
          {dashboardData.error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Quick Actions */}
      <Grid item xs={12}>
        <Paper sx={{ 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}>
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
                sx={{ py: 1.5 }}
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
                sx={{ py: 1.5 }}
                color={dashboardData.unreadMessages > 0 ? 'secondary' : 'primary'}
              >
                Messages {dashboardData.unreadMessages > 0 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      px: 1,
                      py: 0.5,
                      bgcolor: 'white',
                      color: 'secondary.main',
                      borderRadius: '50%',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {dashboardData.unreadMessages}
                  </Box>
                )}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<DocumentIcon />}
                onClick={() => navigate('/documents')}
                sx={{ py: 1.5 }}
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
                sx={{ py: 1.5 }}
              >
                Edit Profile
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Today's Schedule */}
      <Grid item xs={12} md={6}>
        <Card sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Today's Schedule
              </Typography>
            </Box>
            <List>
              {dashboardData.upcomingAppointments.length > 0 ? (
                dashboardData.upcomingAppointments.slice(0, 3).map((appointment) => (
                  <ListItem 
                    key={appointment.id}
                    sx={{
                      mb: 1,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <ListItemIcon>
                      <EventIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {appointment.clientName}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(appointment.startTime).toLocaleString()}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: getStatusColor(appointment.status),
                              fontWeight: 500
                            }}
                          >
                            {appointment.status}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem sx={{ 
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  <ListItemIcon>
                    <EventIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="No appointments today"
                    secondary="Your schedule is clear"
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
          {dashboardData.upcomingAppointments.length > 0 && (
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button 
                size="small" 
                onClick={() => navigate('/schedule')}
                endIcon={<ArrowForwardIcon />}
              >
                View Full Schedule
              </Button>
            </CardActions>
          )}
        </Card>
      </Grid>

      {/* Messages */}
      <Grid item xs={12} md={6}>
        <Card sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          boxShadow: theme.shadows[2]
        }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MessageIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Messages
                {dashboardData.unreadMessages > 0 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      px: 1.5,
                      py: 0.5,
                      bgcolor: 'secondary.main',
                      color: 'white',
                      borderRadius: 'pill',
                      fontSize: '0.75rem',
                    }}
                  >
                    {dashboardData.unreadMessages} new
                  </Box>
                )}
              </Typography>
            </Box>
            <List>
              <ListItem sx={{ 
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
              }}>
                <ListItemIcon>
                  <MessageIcon color="action" />
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
          <CardActions sx={{ p: 2, pt: 0 }}>
            <Button 
              size="small" 
              onClick={() => navigate('/messages')}
              endIcon={<ArrowForwardIcon />}
            >
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

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'success.main';
    case 'pending':
      return 'warning.main';
    case 'cancelled':
      return 'error.main';
    default:
      return 'text.secondary';
  }
};

export default Dashboard;
