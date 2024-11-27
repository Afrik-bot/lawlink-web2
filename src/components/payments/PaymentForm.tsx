import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  CardElement,
  useStripe,
  useElements,
  Elements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { STRIPE_PUBLIC_KEY, stripeConfig } from '../../config/stripe';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  amount: number;
  consultantId: string;
  appointmentId?: string;
  paymentType: 'consultation' | 'document_review' | 'retainer' | 'other';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const PaymentFormContent: React.FC<PaymentFormProps> = ({
  amount,
  consultantId,
  appointmentId,
  paymentType,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  React.useEffect(() => {
    // Create PaymentIntent as soon as the component loads
    const createPaymentIntent = async () => {
      try {
        const response = await axios.post('/api/payments/create-intent', {
          amount,
          consultantId,
          appointmentId,
          paymentType
        });
        setClientSecret(response.data.clientSecret);
      } catch (err) {
        setError('Failed to initialize payment. Please try again.');
        onError?.('Failed to initialize payment');
      }
    };

    createPaymentIntent();
  }, [amount, consultantId, appointmentId, paymentType]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        onError?.(stripeError.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess?.();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      onError?.('An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 500 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Payment Details
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Amount to Pay: ${(amount / 100).toFixed(2)}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={!stripe || processing}
              sx={{ mt: 2 }}
            >
              {processing ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Pay $${(amount / 100).toFixed(2)}`
              )}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise} options={stripeConfig}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default PaymentForm;
