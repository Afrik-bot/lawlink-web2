import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';

const TestPayment: React.FC = () => {
  const [amount, setAmount] = useState<number>(1000); // $10.00
  const [showPayment, setShowPayment] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Convert dollars to cents
    const dollars = parseFloat(event.target.value);
    setAmount(Math.round(dollars * 100));
  };

  const handleSuccess = () => {
    setSuccess(true);
    setShowPayment(false);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(false);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Test Payment Integration
        </Typography>

        {!showPayment ? (
          <Stack spacing={3}>
            <TextField
              label="Amount (USD)"
              type="number"
              value={amount / 100}
              onChange={handleAmountChange}
              InputProps={{
                startAdornment: '$',
              }}
            />

            <Button
              variant="contained"
              onClick={() => setShowPayment(true)}
              disabled={amount < 50}
            >
              Pay ${(amount / 100).toFixed(2)}
            </Button>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" onClose={() => setSuccess(false)}>
                Payment successful!
              </Alert>
            )}
          </Stack>
        ) : (
          <Box>
            <PaymentForm
              amount={amount}
              consultantId="test_consultant"
              paymentType="consultation"
              onSuccess={handleSuccess}
              onError={handleError}
            />
            <Button
              sx={{ mt: 2 }}
              onClick={() => setShowPayment(false)}
            >
              Cancel
            </Button>
          </Box>
        )}
      </Paper>

      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payment History
        </Typography>
        <PaymentHistory
          userId="test_user"
          userType="client"
        />
      </Paper>
    </Box>
  );
};

export default TestPayment;
