import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Rating,
  Chip,
  Avatar,
  styled,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ConsultantProfile } from '../../services/ConsultantService';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const FeaturedBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: '4px 8px',
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.75rem',
  fontWeight: 'bold',
}));

interface ConsultantCardProps {
  consultant: ConsultantProfile;
  featured?: boolean;
}

const ConsultantCard: React.FC<ConsultantCardProps> = ({
  consultant,
  featured,
}) => {
  const navigate = useNavigate();

  const {
    id,
    personalInfo,
    professionalInfo,
    rating,
    reviewCount,
  } = consultant;

  const handleViewProfile = () => {
    navigate(`/consultants/${id}`);
  };

  const handleBookConsultation = () => {
    navigate(`/book-consultation/${id}`);
  };

  return (
    <StyledCard elevation={2}>
      {featured && <FeaturedBadge>Featured</FeaturedBadge>}

      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${personalInfo.firstName} ${personalInfo.lastName}`}
            sx={{ width: 56, height: 56, mr: 2 }}
          />
          <Box>
            <Typography variant="h6" gutterBottom>
              {personalInfo.firstName} {personalInfo.lastName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating
                value={rating}
                readOnly
                size="small"
                precision={0.5}
              />
              <Typography variant="body2" color="text.secondary">
                ({reviewCount})
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          {personalInfo.specializations.map((specialization, index) => (
            <Chip
              key={index}
              label={specialization}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {professionalInfo.jurisdiction}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {personalInfo.yearsOfExperience} years of experience
          </Typography>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 2,
          }}
        >
          {personalInfo.bio}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          size="small"
          onClick={handleViewProfile}
          sx={{ mr: 1 }}
        >
          View Profile
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleBookConsultation}
        >
          Book Consultation
        </Button>
      </CardActions>
    </StyledCard>
  );
};

export default ConsultantCard;
