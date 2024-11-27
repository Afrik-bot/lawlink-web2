import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loadStripe } from '@stripe/stripe-js';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';

interface SignUpFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  barNumber?: string;
  legalCredentials: string;
  phoneNumber: string;
}

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    barNumber: '',
    legalCredentials: '',
    phoneNumber: '',
  });

  // Check if coming from subscription flow
  const searchParams = new URLSearchParams(location.search);
  const isFromSubscription = searchParams.get('source') === 'subscription';
  const selectedPlan = sessionStorage.getItem('selectedPlan');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create user account
      const { user: newUser } = await signUp(formData.email, formData.password);
      
      if (!newUser) throw new Error('Failed to create account');

      // Update user profile with additional information
      await setDoc(doc(db, 'users', newUser.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        barNumber: formData.barNumber || null,
        legalCredentials: formData.legalCredentials,
        phoneNumber: formData.phoneNumber || null,
        updatedAt: new Date().toISOString(),
      });

      // Create consultant profile
      await setDoc(doc(db, 'consultants', newUser.uid), {
        userId: newUser.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        barNumber: formData.barNumber || null,
        legalCredentials: formData.legalCredentials,
        phoneNumber: formData.phoneNumber || null,
      });

      // If coming from subscription, proceed with payment
      if (isFromSubscription && selectedPlan) {
        const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);
        if (!stripe) throw new Error('Stripe not initialized');

        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan: selectedPlan,
            userId: newUser.uid,
          }),
        });

        const { sessionId } = await response.json();
        
        // Clear selected plan from session storage
        sessionStorage.removeItem('selectedPlan');

        // Redirect to Stripe checkout
        const { error } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (error) throw error;
      } else {
        // Redirect to dashboard if not subscribing
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error during signup:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Sign Up as Legal Consultant
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please provide your legal qualifications. If you have a bar number, you may include it, but it's not required.
            Other valid credentials include paralegal certifications, legal degrees, or relevant experience.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" noValidate sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="firstName"
              label="First Name"
              id="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="lastName"
              label="Last Name"
              id="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              fullWidth
              name="barNumber"
              label="Bar Number (Optional)"
              id="barNumber"
              value={formData.barNumber}
              onChange={handleInputChange}
              disabled={loading}
              helperText="If you have a bar number, you may enter it here"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              multiline
              rows={3}
              name="legalCredentials"
              label="Legal Credentials"
              id="legalCredentials"
              value={formData.legalCredentials}
              onChange={handleInputChange}
              disabled={loading}
              helperText="Please describe your legal qualifications, certifications, or relevant experience"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="phoneNumber"
              label="Phone Number"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              disabled={loading}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSignUp}
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>

            <Button
              fullWidth
              color="inherit"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Already have an account? Log in
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignUp;
