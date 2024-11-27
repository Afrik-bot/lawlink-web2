import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Link,
  Alert,
  Divider,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

export const NewLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleEmailLogin, handleGoogleLogin, error: authError } = useAuth();
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  useEffect(() => {
    // Show success message from registration if it exists
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = await handleEmailLogin(formData.email, formData.password, formData.rememberMe);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleSubmit = async () => {
    setError(null);
    const success = await handleGoogleLogin();
    if (success) {
      navigate('/dashboard');
    }
  };

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
          {/* Logo and Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              color="primary"
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to continue to LawLink
            </Typography>
          </Box>

          {/* Success Alert */}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Error Alert */}
          {(error || authError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || authError}
            </Alert>
          )}

          {/* Google Sign In Button */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSubmit}
            startIcon={<GoogleIcon sx={{ color: '#4285F4' }} />}
            sx={{
              mb: 3,
              py: 1,
              bgcolor: '#ffffff',
              color: '#757575',
              border: '1px solid #dadce0',
              '&:hover': {
                bgcolor: '#f8f9fa',
                border: '1px solid #dadce0',
              },
              '& .MuiButton-startIcon': {
                marginRight: 2,
              },
            }}
          >
            Sign in with <Box component="span" sx={{ color: '#4285F4', ml: 0.5 }}>G</Box>
            <Box component="span" sx={{ color: '#EA4335' }}>o</Box>
            <Box component="span" sx={{ color: '#FBBC05' }}>o</Box>
            <Box component="span" sx={{ color: '#4285F4' }}>g</Box>
            <Box component="span" sx={{ color: '#34A853' }}>l</Box>
            <Box component="span" sx={{ color: '#EA4335' }}>e</Box>
          </Button>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Email Sign In Form */}
          <form onSubmit={handleEmailSubmit} noValidate>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              margin="normal"
              required
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    color="primary"
                  />
                }
                label="Remember me"
              />
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                color="primary"
                underline="hover"
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mb: 2 }}
            >
              Sign In
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                color="primary"
                underline="hover"
              >
                Sign up
              </Link>
            </Typography>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default NewLogin;
