import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Check as CheckIcon,
  Clear as CrossIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { Plan } from '../../services/PlanService';

interface PlanComparisonModalProps {
  open: boolean;
  onClose: () => void;
  plans: Plan[];
  onSelectPlan: (planId: string) => void;
  selectedPlanId?: string;
}

interface FeatureComparison {
  name: string;
  description: string;
  getValue: (plan: Plan) => boolean | number | string;
  renderValue?: (value: boolean | number | string) => React.ReactNode;
}

const features: FeatureComparison[] = [
  {
    name: 'Monthly Price',
    description: 'Monthly subscription cost',
    getValue: (plan) => plan.price,
    renderValue: (value) => `$${value}`,
  },
  {
    name: 'Maximum Clients',
    description: 'Maximum number of active clients allowed',
    getValue: (plan) => plan.maxClients || 'Unlimited',
  },
  {
    name: 'Monthly Appointments',
    description: 'Maximum appointments per month',
    getValue: (plan) => plan.maxAppointmentsPerMonth || 'Unlimited',
  },
  {
    name: 'Video Calls',
    description: 'Ability to conduct video consultations',
    getValue: (plan) => plan.includesVideoCall,
    renderValue: (value) => value ? <CheckIcon color="success" /> : <CrossIcon color="error" />,
  },
  {
    name: 'Document Sharing',
    description: 'Share and collaborate on documents with clients',
    getValue: (plan) => plan.includesDocumentSharing,
    renderValue: (value) => value ? <CheckIcon color="success" /> : <CrossIcon color="error" />,
  },
  {
    name: 'Session Recording',
    description: 'Record and store consultation sessions',
    getValue: (plan) => plan.includesRecording,
    renderValue: (value) => value ? <CheckIcon color="success" /> : <CrossIcon color="error" />,
  },
  {
    name: 'Custom Branding',
    description: 'Add your own branding to client communications',
    getValue: (plan) => plan.name.toLowerCase().includes('premium'),
    renderValue: (value) => value ? <CheckIcon color="success" /> : <CrossIcon color="error" />,
  },
  {
    name: 'Priority Support',
    description: '24/7 priority customer support',
    getValue: (plan) => plan.name.toLowerCase().includes('premium'),
    renderValue: (value) => value ? <CheckIcon color="success" /> : <CrossIcon color="error" />,
  },
];

const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  open,
  onClose,
  plans,
  onSelectPlan,
  selectedPlanId,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Plan Comparison
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle1" fontWeight="bold">
                  Features
                </Typography>
              </TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.id} align="center">
                  <Typography variant="h6" gutterBottom>
                    {plan.name}
                  </Typography>
                  {selectedPlanId === plan.id ? (
                    <Button variant="contained" disabled>
                      Selected
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => onSelectPlan(plan.id)}
                    >
                      Select
                    </Button>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {features.map((feature) => (
              <TableRow key={feature.name}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {feature.name}
                    <Tooltip title={feature.description}>
                      <InfoIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Box>
                </TableCell>
                {plans.map((plan) => {
                  const value = feature.getValue(plan);
                  return (
                    <TableCell key={plan.id} align="center">
                      {feature.renderValue ? feature.renderValue(value) : value}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            * All plans include basic features such as appointment scheduling, client management,
            and secure messaging.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            * Prices shown are billed monthly. Annual billing available with 2 months free.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PlanComparisonModal;
