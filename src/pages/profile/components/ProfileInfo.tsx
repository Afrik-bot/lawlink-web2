import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  School as EducationIcon,
  Work as WorkIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';

interface ProfileInfoProps {
  profile: {
    bio: string;
    languages: string[];
    education: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    experience: Array<{
      position: string;
      company: string;
      period: string;
    }>;
  };
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* Bio Section */}
      <Grid item xs={12}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            background: '#ffffff',
            boxShadow: theme.shadows[1],
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            About Me
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            {profile.bio}
          </Typography>
        </Paper>
      </Grid>

      {/* Languages Section */}
      <Grid item xs={12} md={4}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            background: '#ffffff',
            height: '100%',
            boxShadow: theme.shadows[1],
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LanguageIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              Languages
            </Typography>
          </Box>
          <List dense>
            {profile.languages.map((language, index) => (
              <ListItem key={language}>
                <ListItemText
                  primary={language}
                  sx={{
                    '& .MuiTypography-root': {
                      color: theme.palette.text.secondary,
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Education Section */}
      <Grid item xs={12} md={8}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            background: '#ffffff',
            height: '100%',
            boxShadow: theme.shadows[1],
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EducationIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              Education
            </Typography>
          </Box>
          <List>
            {profile.education.map((edu, index) => (
              <React.Fragment key={`${edu.degree}-${edu.year}`}>
                <ListItem
                  sx={{
                    px: 0,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {edu.degree}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {edu.institution}
                        </Typography>
                        {' • '}
                        <Typography component="span" variant="body2" color="text.secondary">
                          {edu.year}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < profile.education.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Experience Section */}
      <Grid item xs={12}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            background: '#ffffff',
            boxShadow: theme.shadows[1],
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WorkIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              Professional Experience
            </Typography>
          </Box>
          <List>
            {profile.experience.map((exp, index) => (
              <React.Fragment key={`${exp.position}-${exp.period}`}>
                <ListItem
                  sx={{
                    px: 0,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {exp.position}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {exp.company}
                        </Typography>
                        {' • '}
                        <Typography component="span" variant="body2" color="text.secondary">
                          {exp.period}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < profile.experience.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ProfileInfo;
