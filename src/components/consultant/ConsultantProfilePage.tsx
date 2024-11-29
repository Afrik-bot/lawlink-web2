import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  Rating,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Alert,
  Dialog,
} from '@mui/material';
import {
  School as SchoolIcon,
  LocationOn as LocationIcon,
  WorkHistory as WorkHistoryIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';
import consultantService, { ConsultantProfile } from '../../services/ConsultantService';
import ContactConsultantModal from './ContactConsultantModal';
import BookingCalendar from './BookingCalendar';
import ReviewsSection from './ReviewsSection';

const ConsultantProfilePage: React.FC = () => {
  const { consultantId } = useParams<{ consultantId: string }>();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState<ConsultantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    rating: 0,
    reviewCount: 0,
  });

  useEffect(() => {
    loadConsultantProfile();
  }, [consultantId]);

  const loadConsultantProfile = async () => {
    if (!consultantId) return;
    
    try {
      setLoading(true);
      setError(null);
      const profile = await consultantService.getConsultantById(consultantId);
      if (!profile) {
        setError('Consultant not found');
        return;
      }
      setConsultant(profile);
    } catch (err) {
      console.error('Error loading consultant profile:', err);
      setError('Failed to load consultant profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingUpdate = (newRating: number, newReviewCount: number) => {
    setReviewStats({
      rating: newRating,
      reviewCount: newReviewCount,
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={30} />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !consultant) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Consultant not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Left Column - Profile Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${consultant.personalInfo.firstName} ${consultant.personalInfo.lastName}`}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              />
              <Typography variant="h5" gutterBottom>
                {consultant.personalInfo.firstName} {consultant.personalInfo.lastName}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                <Rating value={consultant.rating} readOnly precision={0.5} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({consultant.reviewCount} reviews)
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                {consultant.personalInfo.specializations.map((specialization, index) => (
                  <Chip
                    key={index}
                    label={specialization}
                    color="primary"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>

              <Button
                variant="contained"
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => setContactModalOpen(true)}
              >
                Contact Consultant
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setBookingModalOpen(true)}
              >
                Book Consultation
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Jurisdiction"
                    secondary={consultant.professionalInfo.jurisdiction}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <WorkHistoryIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Experience"
                    secondary={`${consultant.personalInfo.yearsOfExperience} years`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <GavelIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="License Number"
                    secondary={consultant.professionalInfo.licenseNumber}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Session Duration"
                    secondary={`${consultant.availability.defaultSessionDuration} minutes`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Detailed Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              About Me
            </Typography>
            <Typography variant="body1" paragraph>
              {consultant.personalInfo.bio}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Education & Certifications
            </Typography>
            <List>
              {consultant.professionalInfo.education.map((edu, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <SchoolIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={edu.degree}
                    secondary={`${edu.institution} - ${edu.year}`}
                  />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Certifications
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {consultant.professionalInfo.certifications.map((cert, index) => (
                <Chip key={index} label={cert} variant="outlined" />
              ))}
            </Box>
          </Paper>

          {/* Reviews Section */}
          <ReviewsSection
            consultantId={consultantId}
            onRatingUpdate={handleRatingUpdate}
          />
        </Grid>
      </Grid>

      {/* Contact Modal */}
      <ContactConsultantModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        consultant={consultant}
      />

      {/* Booking Modal */}
      <Dialog
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <BookingCalendar
          consultant={consultant}
          onClose={() => setBookingModalOpen(false)}
        />
      </Dialog>
    </Container>
  );
};

export default ConsultantProfilePage;
