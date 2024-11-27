import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Rating,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  useTheme,
  useMediaQuery,
  Skeleton,
  Alert
} from '@mui/material';
import {
  Gavel,
  Schedule,
  VideoCall,
  School,
  Language,
  LocationOn,
  CheckCircle,
  Verified,
  Business
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { useConsultantProfile } from '../../hooks/useConsultantProfile';
import { formatDistanceToNow } from 'date-fns';
import StreamingModal from '../../components/streaming/StreamingModal';
import { ConsultantProfile } from '../../types/consultant';

const LegalConsultant: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const navigate = useNavigate();
  const { consultantId } = useParams<{ consultantId: string }>();
  const { profile, loading, error } = useConsultantProfile({ 
    consultantId: consultantId || ''
  });
  const [streamingOpen, setStreamingOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  const handleScheduleConsultation = () => {
    navigate(`/consultation/schedule/${consultantId}`);
  };

  const handleStartStreaming = async () => {
    try {
      // In a real implementation, you would create a session on your backend
      const newSessionId = `session_${Date.now()}`;
      setSessionId(newSessionId);
      setStreamingOpen(true);
    } catch (error) {
      console.error('Failed to start streaming:', error);
    }
  };

  const handleCloseStreaming = () => {
    setStreamingOpen(false);
    setSessionId('');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Skeleton variant="circular" width={150} height={150} />
                </Grid>
                <Grid item xs={12} sm>
                  <Skeleton variant="text" width="60%" height={40} />
                  <Skeleton variant="text" width="40%" height={30} />
                  <Skeleton variant="text" width="30%" height={24} />
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="rectangular" width={120} height={36} sx={{ mr: 1, display: 'inline-block' }} />
                    <Skeleton variant="rectangular" width={120} height={36} sx={{ display: 'inline-block' }} />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load consultant profile. Please try again later.
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          Consultant profile not found.
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Profile Header */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Avatar
                    sx={{
                      width: isMobile ? 100 : 150,
                      height: isMobile ? 100 : 150,
                      border: `3px solid ${theme.palette.primary.main}`
                    }}
                    src={profile.profileImage}
                    alt={profile.title}
                  />
                </Grid>
                <Grid item xs={12} sm>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h4" gutterBottom>
                        {profile.title}
                      </Typography>
                      {profile.verificationStatus === 'verified' && (
                        <Verified color="primary" />
                      )}
                    </Box>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      {profile.yearsOfExperience} Years of Experience
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Rating value={profile.rating.average} precision={0.1} readOnly />
                      <Typography variant="body2" color="textSecondary">
                        ({profile.rating.average.toFixed(1)}/5 • {profile.rating.count} reviews)
                      </Typography>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {profile.specializations.map((specialization, index) => (
                        <Chip
                          key={index}
                          icon={<Gavel />}
                          label={specialization}
                          color={index === 0 ? 'primary' : 'default'}
                        />
                      ))}
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Schedule />}
                      onClick={handleScheduleConsultation}
                      sx={{ mr: 2 }}
                    >
                      Schedule Consultation
                    </Button>
                    {profile.consultationSettings.isVirtualAvailable && (
                      <>
                        <Button
                          variant="outlined"
                          startIcon={<VideoCall />}
                          onClick={handleStartStreaming}
                          sx={{ mr: 2 }}
                        >
                          Start Live Session
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<VideoCall />}
                          onClick={() => navigate(`/consultation/video/${consultantId}`)}
                        >
                          Schedule Video Call
                        </Button>
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  About Me
                </Typography>
                <Typography variant="body1" paragraph>
                  {profile.bio}
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Areas of Expertise
                </Typography>
                <List>
                  {profile.expertise.map((exp, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={exp.area}
                        secondary={`${exp.years} years • ${exp.description}`}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Education
                </Typography>
                <List>
                  {profile.education.map((edu, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <School color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={edu.degree}
                        secondary={`${edu.institution} • ${edu.year}`}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Bar Admissions
                </Typography>
                <List>
                  {profile.barAdmissions.map((admission, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Gavel color={admission.status === 'active' ? 'primary' : 'error'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${admission.state} Bar`}
                        secondary={`${admission.year} • ${admission.status.charAt(0).toUpperCase() + admission.status.slice(1)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Client Reviews
                </Typography>
                {profile.reviews.map((review, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {review.clientId[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">Client #{review.clientId.slice(-4)}</Typography>
                        <Rating value={review.rating} size="small" readOnly />
                      </Box>
                    </Box>
                    {review.comment && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        {review.comment}
                      </Typography>
                    )}
                    <Typography variant="caption" color="textSecondary">
                      {formatDistanceToNow(new Date(review.date), { addSuffix: true })}
                    </Typography>
                    {index !== profile.reviews.length - 1 && (
                      <Divider sx={{ my: 2 }} />
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Consultation Details
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Duration & Pricing"
                      secondary={profile.consultationSettings.durations.map(d => 
                        `${d.minutes} min - $${d.price}`
                      ).join(' / ')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Language color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Languages"
                      secondary={profile.languages.join(', ')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Location"
                      secondary={`${profile.location.city}, ${profile.location.state} (${profile.consultationSettings.isVirtualAvailable ? 'Virtual Available' : 'In-person Only'})`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Professional Memberships
                </Typography>
                <List dense>
                  {profile.professionalMemberships.map((membership, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Business color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={membership.organization}
                        secondary={`${membership.role ? `${membership.role} • ` : ''}Since ${membership.yearJoined}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Availability
                </Typography>
                <List dense>
                  {profile.availability.map((slot, index) => {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return (
                      <ListItem key={index}>
                        <ListItemText
                          primary={days[slot.dayOfWeek]}
                          secondary={`${slot.startTime} - ${slot.endTime}`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<Schedule />}
                  onClick={handleScheduleConsultation}
                  sx={{ mt: 2 }}
                >
                  Check Available Slots
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      {streamingOpen && sessionId && (
        <StreamingModal
          open={streamingOpen}
          onClose={handleCloseStreaming}
          sessionId={sessionId}
          isHost={user?.id === consultantId}
          title={`Live Session with ${profile.title}`}
        />
      )}
    </>
  );
};

export default LegalConsultant;
