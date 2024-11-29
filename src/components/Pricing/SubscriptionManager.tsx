import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import paymentService from '../../services/PaymentService';
import { loadStripe } from '@stripe/stripe-js';

interface PlanDetails {
  title: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

type Plans = {
  [key: string]: PlanDetails;
};

const SubscriptionManager: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const plans: Plans = {
    basic: {
      title: 'Basic',
      price: 49,
      features: [
        'Basic profile listing',
        'Up to 10 sessions/month',
        'Standard support',
      ],
    },
    professional: {
      title: 'Professional',
      price: 99,
      features: [
        'Featured profile listing',
        'Unlimited sessions',
        'Priority support',
        'Advanced analytics',
        'Custom branding',
      ],
      recommended: true,
    },
    enterprise: {
      title: 'Enterprise',
      price: 199,
      features: [
        'Premium profile listing',
        'Unlimited sessions',
        '24/7 dedicated support',
        'White-label solution',
        'API access',
        'Custom integrations',
      ],
    },
  };

  const handleSelectPlan = async (plan: string) => {
    try {
      setLoading(true);
      setSelectedPlan(plan);
      setConfirmDialogOpen(true);
    } catch (error) {
      console.error('Error selecting plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;

    try {
      setLoading(true);
      
      // If user is not logged in, store plan and redirect to signup
      if (!user) {
        sessionStorage.setItem('selectedPlan', selectedPlan);
        navigate('/signup?source=subscription');
        return;
      }

      // If user is logged in, proceed with Stripe checkout
      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);
      if (!stripe) throw new Error('Stripe not initialized');

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: user.uid,
        }),
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating subscription:', error);
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  };

  return (
    <Grid container spacing={4} justifyContent="center">
      {Object.entries(plans).map(([planId, plan]) => (
        <Grid item xs={12} sm={6} md={4} key={planId}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transform: plan.recommended ? 'scale(1.05)' : 'none',
              border: plan.recommended ? `2px solid ${theme.palette.primary.main}` : 'none',
            }}
          >
            {plan.recommended && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  px: 2,
                  py: 0.5,
                  borderBottomLeftRadius: 4,
                }}
              >
                Recommended
              </Box>
            )}
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="h2" gutterBottom>
                {plan.title}
              </Typography>
              <Typography variant="h3" component="div" gutterBottom>
                ${plan.price}
                <Typography variant="subtitle1" component="span" color="text.secondary">
                  /month
                </Typography>
              </Typography>
              <List>
                {plan.features.map((feature, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Check color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                variant={plan.recommended ? 'contained' : 'outlined'}
                onClick={() => handleSelectPlan(planId)}
                disabled={loading}
              >
                {loading && selectedPlan === planId ? 'Processing...' : 'Select Plan'}
              </Button>
            </Box>
          </Card>
        </Grid>
      ))}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Subscription Change</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to subscribe to the {selectedPlan} plan?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmSubscription}
            variant="contained"
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      {loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(0, 0, 0, 0.5)' }}>
          <CircularProgress />
        </Box>
      )}
    </Grid>
  );
};

export default SubscriptionManager;
