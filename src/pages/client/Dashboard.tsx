import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Description as CaseIcon,
  CalendarToday as CalendarIcon,
  Message as MessageIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';

const ClientDashboard = () => {
  const { user } = useAuth();

  // Mock data (replace with actual data from API)
  const activeCases = [
    { id: 1, title: 'Contract Review', consultant: 'John Smith', status: 'In Progress' },
    { id: 2, title: 'Property Dispute', consultant: 'Sarah Johnson', status: 'Scheduled' },
  ];

  const upcomingAppointments = [
    { id: 1, consultant: 'John Smith', date: '2024-02-15', time: '10:00 AM', type: 'Video Call' },
    { id: 2, consultant: 'Sarah Johnson', date: '2024-02-17', time: '2:30 PM', type: 'In Person' },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your legal matters and upcoming appointments.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                size="small"
                onClick={() => {/* TODO: Implement search */}}
              >
                Find Consultant
              </Button>
              <Button
                variant="outlined"
                startIcon={<MessageIcon />}
                size="small"
                onClick={() => {/* TODO: Implement new message */}}
              >
                New Message
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Active Cases */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Active Cases
            </Typography>
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {activeCases.map((case_, index) => (
                <React.Fragment key={case_.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>
                        <CaseIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={case_.title}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {case_.consultant}
                          </Typography>
                          {` — ${case_.status}`}
                        </>
                      }
                    />
                  </ListItem>
                  {index < activeCases.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
            <Button color="primary" sx={{ mt: 1 }}>
              View All Cases
            </Button>
          </Paper>
        </Grid>

        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6} lg={5}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Upcoming Appointments
            </Typography>
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {upcomingAppointments.map((appointment, index) => (
                <React.Fragment key={appointment.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>
                        <CalendarIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${appointment.date} at ${appointment.time}`}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {appointment.consultant}
                          </Typography>
                          {` — ${appointment.type}`}
                        </>
                      }
                    />
                  </ListItem>
                  {index < upcomingAppointments.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
            <Button color="primary" sx={{ mt: 1 }}>
              View Calendar
            </Button>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <MessageIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="New message from John Smith"
                  secondary="2 hours ago"
                />
              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <CaseIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Contract Review document updated"
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

export default ClientDashboard;
