import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ConsultantRegistration } from '../../services/PlanService';

interface AvailabilitySetupProps {
  onSubmit: (values: ConsultantRegistration['availability']) => void;
}

const validationSchema = Yup.object({
  timezone: Yup.string().required('Timezone is required'),
  defaultSessionDuration: Yup.number()
    .min(15, 'Session duration must be at least 15 minutes')
    .max(240, 'Session duration cannot exceed 4 hours')
    .required('Default session duration is required'),
});

const AvailabilitySetup: React.FC<AvailabilitySetupProps> = ({ onSubmit }) => {
  const timezones = Intl.supportedValuesOf('timeZone');

  const formik = useFormik({
    initialValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      defaultSessionDuration: 60,
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Availability Settings
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Set up your default availability preferences
      </Typography>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="timezone-label">Timezone</InputLabel>
              <Select
                labelId="timezone-label"
                id="timezone"
                name="timezone"
                value={formik.values.timezone}
                onChange={formik.handleChange}
                error={formik.touched.timezone && Boolean(formik.errors.timezone)}
                label="Timezone"
              >
                {timezones.map((timezone) => (
                  <MenuItem key={timezone} value={timezone}>
                    {timezone.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              id="defaultSessionDuration"
              name="defaultSessionDuration"
              label="Default Session Duration (minutes)"
              type="number"
              value={formik.values.defaultSessionDuration}
              onChange={formik.handleChange}
              error={
                formik.touched.defaultSessionDuration &&
                Boolean(formik.errors.defaultSessionDuration)
              }
              helperText={
                formik.touched.defaultSessionDuration &&
                formik.errors.defaultSessionDuration
              }
              InputProps={{
                inputProps: {
                  min: 15,
                  max: 240,
                  step: 15,
                },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
              >
                Complete Registration
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Note: After registration, you can set up your detailed weekly schedule and
          manage your availability in the consultant dashboard.
        </Typography>
      </Box>
    </Box>
  );
};

export default AvailabilitySetup;
