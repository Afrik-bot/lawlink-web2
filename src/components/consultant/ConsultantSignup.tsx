import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PlanSelection from './PlanSelection';
import PersonalInfoForm from './PersonalInfoForm';
import ProfessionalInfoForm from './ProfessionalInfoForm';
import AvailabilitySetup from './AvailabilitySetup';
import planService, { ConsultantRegistration, Plan } from '../../services/PlanService';
import { useAuth } from '../../contexts/AuthContext';

const steps = [
  'Select Plan',
  'Personal Information',
  'Professional Details',
  'Availability Setup',
];

const ConsultantSignup: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<Partial<ConsultantRegistration>>({
    userId: currentUser?.uid,
  });

  useEffect(() => {
    loadPlans();
    checkExistingRegistration();
  }, []);

  const loadPlans = async () => {
    try {
      const availablePlans = await planService.getAllPlans();
      setPlans(availablePlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      setError('Failed to load available plans');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingRegistration = async () => {
    if (!currentUser?.uid) return;

    try {
      const existingConsultant = await planService.getConsultantByUserId(currentUser.uid);
      if (existingConsultant) {
        navigate('/consultant/dashboard');
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePlanSelect = (planId: string) => {
    setRegistration((prev) => ({
      ...prev,
      planId,
    }));
    handleNext();
  };

  const handlePersonalInfoSubmit = (personalInfo: ConsultantRegistration['personalInfo']) => {
    setRegistration((prev) => ({
      ...prev,
      personalInfo,
    }));
    handleNext();
  };

  const handleProfessionalInfoSubmit = (professionalInfo: ConsultantRegistration['professionalInfo']) => {
    setRegistration((prev) => ({
      ...prev,
      professionalInfo,
    }));
    handleNext();
  };

  const handleAvailabilitySubmit = async (availability: ConsultantRegistration['availability']) => {
    try {
      setLoading(true);
      const finalRegistration: ConsultantRegistration = {
        ...registration as ConsultantRegistration,
        availability,
      };

      const consultantId = await planService.registerConsultant(finalRegistration);
      navigate(`/consultant/payment-setup?consultantId=${consultantId}&planId=${finalRegistration.planId}`);
    } catch (error) {
      console.error('Error registering consultant:', error);
      setError('Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <PlanSelection plans={plans} onSelect={handlePlanSelect} />;
      case 1:
        return <PersonalInfoForm onSubmit={handlePersonalInfoSubmit} />;
      case 2:
        return <ProfessionalInfoForm onSubmit={handleProfessionalInfoSubmit} />;
      case 3:
        return <AvailabilitySetup onSubmit={handleAvailabilitySubmit} />;
      default:
        return 'Unknown step';
    }
  };

  if (loading && activeStep === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Become a Consultant
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4 }}>
          {getStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ConsultantSignup;
