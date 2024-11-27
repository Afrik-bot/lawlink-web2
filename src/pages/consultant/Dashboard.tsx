import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Description as CaseIcon,
  CalendarToday as CalendarIcon,
  Message as MessageIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';

const ConsultantDashboard = () => {
  const { user } = useAuth();
  const theme = useTheme();

  // Mock data (replace with actual data from API)
  const activeCases = [
    { id: 1, title: 'Contract Review', client: 'Alice Brown', status: 'In Progress', progress: 75 },
    { id: 2, title: 'Property Dispute', client: 'Bob Wilson', status: 'New', progress: 20 },
    { id: 3, title: 'Business Advisory', client: 'Carol Davis', status: 'Review', progress: 90 },
  ];

  const upcomingAppointments = [
    { id: 1, client: 'Alice Brown', date: '2024-02-15', time: '10:00 AM', type: 'Video Call' },
    { id: 2, client: 'Bob Wilson', date: '2024-02-17', time: '2:30 PM', type: 'In Person' },
  ];

  const statistics = [
    { 
      title: 'Active Cases', 
      value: '12', 
      icon: <CaseIcon />, 
      gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
      lightColor: '#e1f5fe'
    },
    { 
      title: 'Monthly Earnings', 
      value: '$8,540', 
      icon: <MoneyIcon />, 
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      lightColor: '#e8f5e9'
    },
    { 
      title: 'Client Rating', 
      value: '4.8/5', 
      icon: <TrendingUpIcon />, 
      gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
      lightColor: '#ffebee'
    },
    { 
      title: 'Total Clients', 
      value: '45', 
      icon: <PeopleIcon />, 
      gradient: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
      lightColor: '#fff3e0'
    },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <Box 
        sx={{ 
          mb: 4,
          p: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
          boxShadow: theme.shadows[4]
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Here's an overview of your cases and upcoming appointments.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statistics.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Paper
              sx={{
                p: 2,
                height: 140,
                background: stat.gradient,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
                boxShadow: theme.shadows[4],
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      mr: 2,
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                  {stat.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  right: -20,
                  bottom: -20,
                  opacity: 0.1,
                  transform: 'scale(2)',
                }}
              >
                {stat.icon}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Active Cases */}
        <Grid item xs={12} md={7}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
              borderRadius: 2,
              background: '#ffffff',
              boxShadow: theme.shadows[3],
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              Active Cases
            </Typography>
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {activeCases.map((case_, index) => (
                <React.Fragment key={case_.id}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        <CaseIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {case_.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ fontWeight: 500 }}
                          >
                            {case_.client}
                          </Typography>
                          {` — ${case_.status}`}
                          <LinearProgress
                            variant="determinate"
                            value={case_.progress}
                            sx={{ 
                              mt: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(0, 0, 0, 0.05)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                              },
                            }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < activeCases.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
            <Button 
              color="primary" 
              sx={{ 
                mt: 2,
                alignSelf: 'flex-start',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              endIcon={<ArrowForwardIcon />}
            >
              View All Cases
            </Button>
          </Paper>
        </Grid>

        {/* Upcoming Appointments */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
              borderRadius: 2,
              background: '#ffffff',
              boxShadow: theme.shadows[3],
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              Today's Schedule
            </Typography>
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {upcomingAppointments.map((appointment, index) => (
                <React.Fragment key={appointment.id}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                        <CalendarIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {`${appointment.time} - ${appointment.client}`}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{ 
                              color: theme.palette.secondary.main,
                              fontWeight: 500,
                            }}
                          >
                            {appointment.type}
                          </Typography>
                          {` — ${appointment.date}`}
                        </>
                      }
                    />
                  </ListItem>
                  {index < upcomingAppointments.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
            <Button 
              color="secondary" 
              sx={{ 
                mt: 2,
                alignSelf: 'flex-start',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              endIcon={<ArrowForwardIcon />}
            >
              View Calendar
            </Button>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 2,
              background: '#ffffff',
              boxShadow: theme.shadows[3],
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
              Recent Activity
            </Typography>
            <List>
              <ListItem
                sx={{
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                    <MessageIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      New message from Alice Brown
                    </Typography>
                  }
                  secondary="2 hours ago"
                />
              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem
                sx={{
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                    <CaseIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      Contract Review document updated
                    </Typography>
                  }
                  secondary="Yesterday"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default ConsultantDashboard;
