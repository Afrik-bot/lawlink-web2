import React from 'react';
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
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ClientDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();

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
                Messages
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
              <ListItem>
                <ListItemIcon>
                  <EventIcon />
                </ListItemIcon>
                <ListItemText
                  primary="No upcoming appointments"
                  secondary="Click 'Book Consultation' to schedule one"
                />
              </ListItem>
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
              Recent Messages
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <MessageIcon />
                </ListItemIcon>
                <ListItemText
                  primary="No recent messages"
                  secondary="Your messages will appear here"
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
                Messages
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
              <ListItem>
                <ListItemIcon>
                  <EventIcon />
                </ListItemIcon>
                <ListItemText
                  primary="No appointments today"
                  secondary="Your schedule is clear"
                />
              </ListItem>
            </List>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/schedule')}>
              View Full Schedule
            </Button>
          </CardActions>
        </Card>
      </Grid>

      {/* Recent Consultations */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Consultations
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="No recent consultations"
                  secondary="Your consultation history will appear here"
                />
              </ListItem>
            </List>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/consultations')}>
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Welcome, {user?.firstName || 'User'}!
        </Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {user?.role === 'client' ? <ClientDashboard /> : <ConsultantDashboard />}
    </Container>
  );
};

export default Dashboard;
