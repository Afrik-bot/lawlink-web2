import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Check as CheckIcon,
  VideoCall as VideoCallIcon,
  Description as DocumentIcon,
  RadioButtonChecked as RecordingIcon,
  People as PeopleIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { Plan } from '../../services/PlanService';
import PlanComparisonModal from './PlanComparisonModal';

interface PlanSelectionProps {
  plans: Plan[];
  onSelect: (planId: string) => void;
}

const PlanSelection: React.FC<PlanSelectionProps> = ({ plans, onSelect }) => {
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();

  const handleSelect = (planId: string) => {
    setSelectedPlanId(planId);
    onSelect(planId);
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes('video')) return <VideoCallIcon />;
    if (feature.toLowerCase().includes('document')) return <DocumentIcon />;
    if (feature.toLowerCase().includes('recording')) return <RecordingIcon />;
    if (feature.toLowerCase().includes('client')) return <PeopleIcon />;
    if (feature.toLowerCase().includes('appointment')) return <EventIcon />;
    return <CheckIcon />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Choose Your Plan
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Select the plan that best fits your practice
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => setComparisonOpen(true)}
        >
          Compare Plans
        </Button>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transform: selectedPlanId === plan.id ? 'scale(1.02)' : 'none',
                boxShadow: selectedPlanId === plan.id ? 8 : 1,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'scale(1.01)',
                },
              }}
            >
              {plan.name.toLowerCase().includes('premium') && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: -32,
                    transform: 'rotate(45deg)',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    px: 4,
                    py: 0.5,
                  }}
                >
                  Popular
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="div" gutterBottom>
                  {plan.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                  <Typography variant="h4" color="primary">
                    ${plan.price}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 1 }}>
                    /{plan.billingFrequency}
                  </Typography>
                </Box>

                <List>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {getFeatureIcon(feature)}
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                  {plan.maxClients && (
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText primary={`Up to ${plan.maxClients} clients`} />
                    </ListItem>
                  )}
                  {plan.maxAppointmentsPerMonth && (
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <EventIcon />
                      </ListItemIcon>
                      <ListItemText primary={`${plan.maxAppointmentsPerMonth} appointments/month`} />
                    </ListItem>
                  )}
                </List>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant={selectedPlanId === plan.id ? "contained" : "outlined"}
                  fullWidth
                  size="large"
                  onClick={() => handleSelect(plan.id)}
                >
                  {selectedPlanId === plan.id ? 'Selected' : 'Select Plan'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <PlanComparisonModal
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        plans={plans}
        onSelectPlan={handleSelect}
        selectedPlanId={selectedPlanId}
      />

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          All plans include a 14-day free trial. No credit card required to start.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Need a custom plan? <Button>Contact Sales</Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default PlanSelection;
