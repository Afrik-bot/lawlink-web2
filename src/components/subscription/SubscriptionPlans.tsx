import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { legalConsultantPlans, SubscriptionPlan } from '../../config/subscriptionPlans';
import { mockPaymentService } from '../../services/MockPaymentService';
import { useNavigate } from 'react-router-dom';

interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  name: string;
}

const SubscriptionPlans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
  });

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPlan) return;
    
    setLoading(true);
    setError(null);

    try {
      await mockPaymentService.processPayment(selectedPlan, paymentDetails);
      // Simulate successful subscription
      localStorage.setItem('userRole', 'LEGAL_CONSULTANT');
      localStorage.setItem('subscriptionActive', 'true');
      setPaymentDialogOpen(false);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Choose Your Plan
      </Typography>
      <Typography variant="subtitle1" align="center" sx={{ mb: 4 }}>
        Start your journey as a Legal Consultant
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {legalConsultantPlans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: plan.recommended ? '2px solid #2196f3' : 'none'
              }}
            >
              {plan.recommended && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  Recommended
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" gutterBottom>
                  {plan.name}
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  ${plan.price}
                  <Typography variant="subtitle1" component="span" color="text.secondary">
                    /month
                  </Typography>
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {plan.features.map((feature, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{ py: 0.5 }}
                      color="text.secondary"
                    >
                      • {feature}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button
                  variant={plan.recommended ? 'contained' : 'outlined'}
                  fullWidth
                  onClick={() => handlePlanSelect(plan)}
                >
                  Select Plan
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enter Payment Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Test Card Numbers:
              <br />
              • Visa: 4242 4242 4242 4242
              <br />
              • Mastercard: 5555 5555 5555 4444
              <br />
              • Amex: 3782 822463 10005
            </Typography>
          </Box>
          <TextField
            label="Card Number"
            fullWidth
            margin="normal"
            value={paymentDetails.cardNumber}
            onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Expiry Date (MM/YY)"
                fullWidth
                margin="normal"
                value={paymentDetails.expiryDate}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="CVV"
                fullWidth
                margin="normal"
                value={paymentDetails.cvv}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
              />
            </Grid>
          </Grid>
          <TextField
            label="Cardholder Name"
            fullWidth
            margin="normal"
            value={paymentDetails.name}
            onChange={(e) => setPaymentDetails({ ...paymentDetails, name: e.target.value })}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Processing...' : 'Subscribe'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionPlans;
