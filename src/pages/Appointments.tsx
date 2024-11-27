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
  CardActions,
  IconButton,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Event as EventIcon,
  Add as AddIcon,
  VideoCall as VideoCallIcon,
  Message as MessageIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const Appointments = () => {
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);

  // Placeholder appointments data
  const appointments = [
    {
      id: 1,
      consultant: 'John Smith',
      date: '2023-12-15',
      time: '10:00 AM',
      status: 'upcoming',
      type: 'video',
    },
    {
      id: 2,
      consultant: 'Sarah Johnson',
      date: '2023-12-20',
      time: '2:30 PM',
      status: 'upcoming',
      type: 'in-person',
    },
    {
      id: 3,
      consultant: 'Michael Brown',
      date: '2023-11-30',
      time: '11:00 AM',
      status: 'completed',
      type: 'video',
    },
  ];

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleBookAppointment = () => {
    // TODO: Implement appointment booking
    handleCloseDialog();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Appointments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Book Appointment
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Upcoming Appointments
          </Typography>
          <Grid container spacing={2}>
            {appointments
              .filter((apt) => apt.status === 'upcoming')
              .map((appointment) => (
                <Grid item xs={12} key={appointment.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <EventIcon sx={{ mr: 1 }} color="primary" />
                        <Typography variant="h6">
                          {appointment.date} at {appointment.time}
                        </Typography>
                        <Chip
                          label={appointment.type}
                          color="primary"
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      </Box>
                      <Typography variant="body1" gutterBottom>
                        Consultant: {appointment.consultant}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<VideoCallIcon />}
                        disabled={appointment.type !== 'video'}
                      >
                        Join Call
                      </Button>
                      <Button size="small" startIcon={<MessageIcon />}>
                        Message
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        sx={{ ml: 'auto' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Grid>

        {/* Past Appointments */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Past Appointments
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {appointments
              .filter((apt) => apt.status === 'completed')
              .map((appointment) => (
                <Box
                  key={appointment.id}
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom>
                    {appointment.consultant}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {appointment.date} at {appointment.time}
                  </Typography>
                  <Chip
                    label={appointment.type}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Book Appointment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Book an Appointment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Consultant"
                defaultValue=""
              >
                <MenuItem value="john">John Smith</MenuItem>
                <MenuItem value="sarah">Sarah Johnson</MenuItem>
                <MenuItem value="michael">Michael Brown</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Appointment Type"
                defaultValue=""
              >
                <MenuItem value="video">Video Call</MenuItem>
                <MenuItem value="in-person">In-Person</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="time"
                label="Time"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Additional Notes"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleBookAppointment} variant="contained">
            Book Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Appointments;
