import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import planService from '../../services/PlanService';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

interface PaymentSetupProps {
  consultantId: string;
  planId: string;
}

const PaymentForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [startTrial, setStartTrial] = useState(true);

  const validateCoupon = async () => {
    if (!couponCode) return;

    try {
      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ couponCode }),
      });

      const data = await response.json();

      if (data.valid) {
        setCouponMessage({ type: 'success', message: `Coupon applied: ${data.discount}% off` });
      } else {
        setCouponMessage({ type: 'error', message: 'Invalid or expired coupon code' });
      }
    } catch (err) {
      setCouponMessage({ type: 'error', message: 'Error validating coupon' });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/consultant/dashboard`,
        },
      });

      if (submitError) {
        setError(submitError.message || 'An error occurred');
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={startTrial}
              onChange={(e) => setStartTrial(e.target.checked)}
            />
          }
          label="Start with a 14-day free trial"
        />
        <Typography variant="body2" color="text.secondary">
          Try our platform risk-free. Your card will only be charged after the trial period.
        </Typography>
      </Box>

      <PaymentElement />

      <Box sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Coupon Code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          InputProps={{
            endAdornment: (
              <Button
                onClick={validateCoupon}
                disabled={!couponCode}
              >
                Apply
              </Button>
            ),
          }}
        />
        {couponMessage && (
          <Alert severity={couponMessage.type} sx={{ mt: 1 }}>
            {couponMessage.message}
          </Alert>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1">
            {startTrial ? 'Free for 14 days' : 'Billed today'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {startTrial
              ? 'Then $XX/month after trial ends'
              : couponMessage?.type === 'success'
                ? 'Discounted price applied'
                : 'Regular price'}
          </Typography>
        </Box>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || processing}
          sx={{ minWidth: 200 }}
        >
          {processing ? <CircularProgress size={24} /> : 'Complete Setup'}
        </Button>
      </Box>
    </form>
  );
};

const PaymentSetup: React.FC<PaymentSetupProps> = ({ consultantId, planId }) => {
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const steps = ['Verify Plan', 'Setup Payment', 'Complete'];

  useEffect(() => {
    if (!consultantId || !planId) {
      setError('Missing required information. Please select a plan first.');
      setLoading(false);
      return;
    }
    initializePayment();
  }, [consultantId, planId]);

  const initializePayment = async () => {
    try {
      // First fetch plan details
      const plan = await planService.getPlan(planId);
      if (!plan) {
        throw new Error('Selected plan not found');
      }
      setSelectedPlan(plan);

      // Get the setup intent client secret from your backend
      const response = await fetch('/api/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultantId,
          planId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment setup');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setClientSecret(data.clientSecret);
      setActiveStep(1);
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to initialize payment setup. Please try again.');
      // If there's an error, navigate back to plan selection
      setTimeout(() => {
        navigate('/consultant/plans');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      await planService.activateConsultant(consultantId);
      setActiveStep(2);
      setTimeout(() => {
        navigate('/consultant/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Activation error:', err);
      setError('Failed to activate account');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Complete Your Registration
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/consultant/plans')}
              sx={{ mt: 2 }}
            >
              Return to Plan Selection
            </Button>
          </Box>
        ) : activeStep === 2 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>
              Setup Complete!
            </Typography>
            <Typography color="text.secondary">
              Redirecting you to your dashboard...
            </Typography>
          </Box>
        ) : (
          <>
            {selectedPlan && (
              <Box sx={{ mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Selected Plan: {selectedPlan.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  ${selectedPlan.price}/{selectedPlan.billingFrequency}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedPlan.features.join(' • ')}
                </Typography>
              </Box>
            )}
            {clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                  },
                }}
              >
                <PaymentForm onSuccess={handlePaymentSuccess} />
              </Elements>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default PaymentSetup;
