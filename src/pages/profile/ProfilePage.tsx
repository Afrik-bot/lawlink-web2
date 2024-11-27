import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tab,
  Tabs,
  Avatar,
  Button,
  Grid,
  useTheme,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  School as EducationIcon,
  Work as WorkIcon,
  Gavel as PracticeIcon,
  Language as LanguageIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import ProfileEditDialog from './components/ProfileEditDialog';
import ProfileInfo from './components/ProfileInfo';
import ProfileReviews from './components/ProfileReviews';
import ProfileCases from './components/ProfileCases';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfilePage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Mock data (replace with API calls)
  const profile = {
    name: `${user?.firstName} ${user?.lastName}`,
    role: 'Legal Consultant',
    avatar: '/path/to/avatar.jpg',
    location: 'San Francisco, CA',
    rating: 4.8,
    reviewCount: 156,
    specializations: ['Corporate Law', 'Intellectual Property', 'Contract Law'],
    languages: ['English', 'Spanish'],
    education: [
      {
        degree: 'J.D.',
        institution: 'Harvard Law School',
        year: '2015',
      },
      {
        degree: 'B.A. in Political Science',
        institution: 'Yale University',
        year: '2012',
      },
    ],
    experience: [
      {
        position: 'Senior Partner',
        company: 'Smith & Associates',
        period: '2018 - Present',
      },
      {
        position: 'Associate Attorney',
        company: 'Johnson Legal Group',
        period: '2015 - 2018',
      },
    ],
    bio: 'Experienced legal professional specializing in corporate law and intellectual property. Passionate about helping businesses navigate complex legal challenges and protect their innovations.',
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Profile Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
          position: 'relative',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={profile.avatar}
              sx={{
                width: 120,
                height: 120,
                border: '4px solid rgba(255, 255, 255, 0.2)',
              }}
            />
          </Grid>
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mr: 2 }}>
                {profile.name}
              </Typography>
              <IconButton
                onClick={() => setIsEditDialogOpen(true)}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <EditIcon />
              </IconButton>
            </Box>
            <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
              {profile.role}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ mr: 0.5, opacity: 0.9 }} />
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {profile.location}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon sx={{ mr: 0.5, opacity: 0.9 }} />
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {profile.rating} ({profile.reviewCount} reviews)
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.specializations.map((spec) => (
                <Chip
                  key={spec}
                  label={spec}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Profile Navigation */}
      <Paper sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            },
          }}
        >
          <Tab label="Profile Info" />
          <Tab label="Cases" />
          <Tab label="Reviews" />
        </Tabs>
      </Paper>

      {/* Profile Content */}
      <TabPanel value={currentTab} index={0}>
        <ProfileInfo profile={profile} />
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        <ProfileCases />
      </TabPanel>
      <TabPanel value={currentTab} index={2}>
        <ProfileReviews />
      </TabPanel>

      {/* Edit Profile Dialog */}
      <ProfileEditDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        profile={profile}
      />
    </Container>
  );
};

export default ProfilePage;
