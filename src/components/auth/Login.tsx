import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Divider,
  Paper,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Google as GoogleIcon, Phone as PhoneIcon, Email as EmailIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

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
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { handleEmailLogin, handleGoogleLogin, handlePhoneLogin, confirmPhoneLogin, error } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleEmailLogin(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleGoogleSubmit = async () => {
    const success = await handleGoogleLogin();
    if (success) {
      navigate('/dashboard');
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const vid = await handlePhoneLogin(formattedPhone);
    if (vid) {
      setVerificationId(vid);
      setShowVerificationDialog(true);
    }
  };

  const handleVerificationSubmit = async () => {
    const success = await confirmPhoneLogin(verificationId, verificationCode);
    if (success) {
      setShowVerificationDialog(false);
      navigate('/dashboard');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Sign In
        </Typography>

        {error && (
          <Typography color="error" align="center" gutterBottom>
            {error}
          </Typography>
        )}

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="auth tabs"
          centered
          sx={{ mb: 2 }}
        >
          <Tab icon={<EmailIcon />} label="Email" />
          <Tab icon={<GoogleIcon />} label="Google" />
          <Tab icon={<PhoneIcon />} label="Phone" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <form onSubmit={handleEmailSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Sign In with Email
            </Button>
          </form>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleGoogleSubmit}
            startIcon={<GoogleIcon />}
            sx={{
              bgcolor: '#ffffff',
              color: '#757575',
              border: '1px solid #dadce0',
              boxShadow: '0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149)',
              '&:hover': {
                bgcolor: '#f8f9fa',
                boxShadow: '0 1px 3px 0 rgba(60,64,67,0.302), 0 4px 8px 3px rgba(60,64,67,0.149)',
              },
              '& .MuiButton-startIcon': {
                marginRight: 2,
                '& svg': {
                  width: 22,
                  height: 22,
                },
              },
              fontFamily: 'Google Sans,Roboto,Arial,sans-serif',
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '16px',
              letterSpacing: '0.25px',
              height: '48px',
            }}
          >
            Sign in with Google
          </Button>
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
              {error}
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <form onSubmit={handlePhoneSubmit}>
            <TextField
              fullWidth
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              margin="normal"
              required
              helperText="Format: +1234567890"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Send Verification Code
            </Button>
          </form>
        </TabPanel>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" align="center">
          Don't have an account?{' '}
          <Button color="primary" onClick={() => navigate('/register')}>
            Sign Up
          </Button>
        </Typography>

        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container" />

        {/* Phone Verification Dialog */}
        <Dialog open={showVerificationDialog} onClose={() => setShowVerificationDialog(false)}>
          <DialogTitle>Enter Verification Code</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Verification Code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              margin="normal"
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowVerificationDialog(false)}>Cancel</Button>
            <Button onClick={handleVerificationSubmit} color="primary">
              Verify
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};
