import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ConsultantRegistration } from '../../services/PlanService';

interface PersonalInfoFormProps {
  onSubmit: (values: ConsultantRegistration['personalInfo']) => void;
}

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  specialization: Yup.string().required('Specialization is required'),
  yearsOfExperience: Yup.number()
    .min(0, 'Years of experience must be positive')
    .required('Years of experience is required'),
  bio: Yup.string()
    .min(100, 'Bio must be at least 100 characters')
    .max(1000, 'Bio must not exceed 1000 characters')
    .required('Bio is required'),
});

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialization: '',
      yearsOfExperience: 0,
      bio: '',
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Personal Information
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Tell us about yourself
      </Typography>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="firstName"
              name="firstName"
              label="First Name"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              error={formik.touched.firstName && Boolean(formik.errors.firstName)}
              helperText={formik.touched.firstName && formik.errors.firstName}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="lastName"
              name="lastName"
              label="Last Name"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              error={formik.touched.lastName && Boolean(formik.errors.lastName)}
              helperText={formik.touched.lastName && formik.errors.lastName}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="phone"
              name="phone"
              label="Phone Number"
              value={formik.values.phone}
              onChange={formik.handleChange}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="specialization"
              name="specialization"
              label="Specialization"
              value={formik.values.specialization}
              onChange={formik.handleChange}
              error={formik.touched.specialization && Boolean(formik.errors.specialization)}
              helperText={formik.touched.specialization && formik.errors.specialization}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="yearsOfExperience"
              name="yearsOfExperience"
              label="Years of Experience"
              type="number"
              value={formik.values.yearsOfExperience}
              onChange={formik.handleChange}
              error={formik.touched.yearsOfExperience && Boolean(formik.errors.yearsOfExperience)}
              helperText={formik.touched.yearsOfExperience && formik.errors.yearsOfExperience}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              id="bio"
              name="bio"
              label="Professional Bio"
              multiline
              rows={4}
              value={formik.values.bio}
              onChange={formik.handleChange}
              error={formik.touched.bio && Boolean(formik.errors.bio)}
              helperText={
                (formik.touched.bio && formik.errors.bio) ||
                `${formik.values.bio.length}/1000 characters`
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
              >
                Continue
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default PersonalInfoForm;
