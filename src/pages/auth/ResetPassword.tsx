import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import Footer from '../../components/Footer';

interface PasswordRequirement {
  regex: RegExp;
  message: string;
}

const ResetPassword = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { resetPassword } = useAuth();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const passwordRequirements: PasswordRequirement[] = [
    { regex: /.{8,}/, message: 'At least 8 characters' },
    { regex: /[A-Z]/, message: 'At least one uppercase letter' },
    { regex: /[a-z]/, message: 'At least one lowercase letter' },
    { regex: /[0-9]/, message: 'At least one number' },
    { regex: /[^A-Za-z0-9]/, message: 'At least one special character' },
  ];

  const validatePassword = (password: string): boolean => {
    const newRequirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
    setRequirements(newRequirements);
    return Object.values(newRequirements).every(Boolean);
  };

  useEffect(() => {
    validatePassword(formData.password);
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    if (!validatePassword(formData.password)) {
      setStatus('error');
      setError('Please meet all password requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatus('error');
      setError('Passwords do not match');
      return;
    }

    try {
      if (!token) throw new Error('Reset token is missing');
      await resetPassword(token, formData.password);
      setStatus('success');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful. Please log in with your new password.' } });
      }, 3000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setError('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="sm" sx={{ flex: 1 }}>
        <Box
          sx={{
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            py: 6,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 2,
              bgcolor: 'background.paper',
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
                Reset Password
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please enter your new password below.
              </Typography>
            </Box>

            {/* Status Messages */}
            {status === 'error' && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {status === 'success' && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Password reset successful! Redirecting to login...
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange('password')}
                margin="normal"
                required
                disabled={status === 'loading' || status === 'success'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                margin="normal"
                required
                disabled={status === 'loading' || status === 'success'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password Requirements */}
              <List dense sx={{ mt: 2 }}>
                {passwordRequirements.map((req, index) => {
                  const isMet = req.regex.test(formData.password);
                  return (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {isMet ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={req.message}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: isMet
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                            fontSize: '0.875rem',
                          },
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={status === 'loading' || status === 'success'}
                sx={{ mt: 3 }}
              >
                {status === 'loading' ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </Paper>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
};

export default ResetPassword;
