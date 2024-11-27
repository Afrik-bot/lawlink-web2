import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Rating,
  LinearProgress,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Star as StarIcon,
  Message as MessageIcon,
  ThumbUp as ThumbUpIcon,
} from '@mui/icons-material';
import feedbackService, { FeedbackStats } from '../../services/FeedbackService';

interface ConsultantProfileProps {
  consultantId: string;
  consultantData: {
    displayName: string;
    photoURL?: string;
    specialties?: string[];
    experience?: string;
    about?: string;
  };
}

export const ConsultantProfile: React.FC<ConsultantProfileProps> = ({
  consultantId,
  consultantData,
}) => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const consultantStats = await feedbackService.getConsultantStats(consultantId);
        setStats(consultantStats);
      } catch (error) {
        console.error('Error loading consultant stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [consultantId]);

  if (loading) {
    return <LinearProgress />;
  }

  if (!stats) {
    return null;
  }

  const StatBox = ({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon}
        <Typography variant="h4" component="span" sx={{ ml: 1 }}>
          {typeof value === 'number' ? value.toFixed(1) : value}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={consultantData.photoURL}
            sx={{ width: 80, height: 80, mr: 2 }}
          />
          <Box>
            <Typography variant="h5" gutterBottom>
              {consultantData.displayName}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {consultantData.specialties?.map((specialty) => (
                <Chip key={specialty} label={specialty} size="small" />
              ))}
            </Box>
          </Box>
        </Box>

        <Typography variant="body1" paragraph>
          {consultantData.about}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Experience: {consultantData.experience}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <StatBox
              value={stats.averageRating}
              label="Average Rating"
              icon={<StarIcon color="primary" />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatBox
              value={stats.totalFeedback}
              label="Total Reviews"
              icon={<MessageIcon color="primary" />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatBox
              value={stats.recommendationRate}
              label="Would Recommend"
              icon={<ThumbUpIcon color="primary" />}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Detailed Ratings
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ mb: 2 }}>
              <Typography component="legend">Communication</Typography>
              <Rating value={stats.averageCommunication} readOnly precision={0.1} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ mb: 2 }}>
              <Typography component="legend">Expertise</Typography>
              <Rating value={stats.averageExpertise} readOnly precision={0.1} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ mb: 2 }}>
              <Typography component="legend">Client Satisfaction</Typography>
              <Rating value={stats.averageSatisfaction} readOnly precision={0.1} />
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Rating Distribution
          </Typography>
          {[5, 4, 3, 2, 1].map((rating) => (
            <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ mr: 1, minWidth: 20 }}>{rating}</Typography>
              <StarIcon sx={{ mr: 1 }} fontSize="small" />
              <LinearProgress
                variant="determinate"
                value={
                  (stats.ratingDistribution[rating] || 0) /
                  stats.totalFeedback *
                  100
                }
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <Typography variant="body2">
                {stats.ratingDistribution[rating] || 0}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ConsultantProfile;
