import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Chip,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ConsultantRegistration } from '../../services/PlanService';

interface ProfessionalInfoFormProps {
  onSubmit: (values: ConsultantRegistration['professionalInfo']) => void;
}

const validationSchema = Yup.object({
  licenseNumber: Yup.string().required('License number is required'),
  jurisdiction: Yup.string().required('Jurisdiction is required'),
  certifications: Yup.array().of(Yup.string()),
  education: Yup.array().of(
    Yup.object({
      institution: Yup.string().required('Institution is required'),
      degree: Yup.string().required('Degree is required'),
      year: Yup.number()
        .min(1950, 'Invalid year')
        .max(new Date().getFullYear(), 'Year cannot be in the future')
        .required('Year is required'),
    })
  ),
});

const ProfessionalInfoForm: React.FC<ProfessionalInfoFormProps> = ({ onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      licenseNumber: '',
      jurisdiction: '',
      certifications: [] as string[],
      education: [
        {
          institution: '',
          degree: '',
          year: new Date().getFullYear(),
        },
      ],
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  const handleAddCertification = () => {
    const certification = window.prompt('Enter certification name');
    if (certification) {
      formik.setFieldValue('certifications', [
        ...formik.values.certifications,
        certification,
      ]);
    }
  };

  const handleRemoveCertification = (index: number) => {
    formik.setFieldValue(
      'certifications',
      formik.values.certifications.filter((_, i) => i !== index)
    );
  };

  const handleAddEducation = () => {
    formik.setFieldValue('education', [
      ...formik.values.education,
      {
        institution: '',
        degree: '',
        year: new Date().getFullYear(),
      },
    ]);
  };

  const handleRemoveEducation = (index: number) => {
    formik.setFieldValue(
      'education',
      formik.values.education.filter((_, i) => i !== index)
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Professional Information
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Tell us about your professional background
      </Typography>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="licenseNumber"
              name="licenseNumber"
              label="License Number"
              value={formik.values.licenseNumber}
              onChange={formik.handleChange}
              error={formik.touched.licenseNumber && Boolean(formik.errors.licenseNumber)}
              helperText={formik.touched.licenseNumber && formik.errors.licenseNumber}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="jurisdiction"
              name="jurisdiction"
              label="Jurisdiction"
              value={formik.values.jurisdiction}
              onChange={formik.handleChange}
              error={formik.touched.jurisdiction && Boolean(formik.errors.jurisdiction)}
              helperText={formik.touched.jurisdiction && formik.errors.jurisdiction}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Certifications
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formik.values.certifications.map((cert, index) => (
                  <Chip
                    key={index}
                    label={cert}
                    onDelete={() => handleRemoveCertification(index)}
                  />
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddCertification}
                  size="small"
                >
                  Add Certification
                </Button>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Education
            </Typography>
            {formik.values.education.map((edu, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      name={`education.${index}.institution`}
                      label="Institution"
                      value={edu.institution}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.education?.[index]?.institution &&
                        Boolean(formik.errors.education?.[index]?.institution)
                      }
                      helperText={
                        formik.touched.education?.[index]?.institution &&
                        formik.errors.education?.[index]?.institution
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      name={`education.${index}.degree`}
                      label="Degree"
                      value={edu.degree}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.education?.[index]?.degree &&
                        Boolean(formik.errors.education?.[index]?.degree)
                      }
                      helperText={
                        formik.touched.education?.[index]?.degree &&
                        formik.errors.education?.[index]?.degree
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      name={`education.${index}.year`}
                      label="Year"
                      value={edu.year}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.education?.[index]?.year &&
                        Boolean(formik.errors.education?.[index]?.year)
                      }
                      helperText={
                        formik.touched.education?.[index]?.year &&
                        formik.errors.education?.[index]?.year
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    {index > 0 && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveEducation(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddEducation}
              sx={{ mt: 1 }}
            >
              Add Education
            </Button>
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

export default ProfessionalInfoForm;
