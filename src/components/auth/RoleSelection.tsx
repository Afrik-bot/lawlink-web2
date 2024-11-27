import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person as PersonIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
          }}
        >
          {/* Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              color="primary"
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Join LawLink
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Choose how you want to use LawLink
            </Typography>
          </Box>

          {/* Role Selection Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate('/client-signup')}
              startIcon={<PersonIcon />}
              sx={{
                py: 2,
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.9),
                },
              }}
            >
              I am a Client
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => navigate('/consultant-signup')}
              startIcon={<GavelIcon />}
              sx={{
                py: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              }}
            >
              I am a Legal Consultant
            </Button>
          </Box>

          {/* Sign In Link */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Typography
                component="span"
                variant="body2"
                color="primary"
                sx={{
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => navigate('/login')}
              >
                Sign in
              </Typography>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RoleSelection;
