import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  Chip,
  useTheme,
  Avatar,
  styled,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { Profile } from '../../../types/profile';

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

interface ProfileEditDialogProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
}

interface FormData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  role: 'client' | 'consultant';
  location: string;
  avatar?: string;
  specializations: string[];
  languages: string[];
  education: string;
  experience: string;
  certifications: string[];
  successRate?: number;
  newSpecialization: string;
  newLanguage: string;
}

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({
  open,
  onClose,
  profile,
}) => {
  const theme = useTheme();
  const defaultRole = profile.role || 'client';
  const defaultLocation = profile.location || '';

  const [formData, setFormData] = useState<FormData>({
    ...profile,
    role: defaultRole,
    location: defaultLocation,
    education: typeof profile.education === 'string' ? profile.education : '',
    experience: typeof profile.experience === 'string' ? profile.experience : '',
    newSpecialization: '',
    newLanguage: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSpecialization = () => {
    if (formData.newSpecialization.trim()) {
      setFormData((prev: FormData) => ({
        ...prev,
        specializations: [...prev.specializations, prev.newSpecialization.trim()],
        newSpecialization: '',
      }));
    }
  };

  const handleRemoveSpecialization = (specToRemove: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      specializations: prev.specializations.filter((spec: string) => spec !== specToRemove),
    }));
  };

  const handleAddLanguage = () => {
    if (formData.newLanguage.trim()) {
      setFormData((prev: FormData) => ({
        ...prev,
        languages: [...prev.languages, prev.newLanguage.trim()],
        newLanguage: '',
      }));
    }
  };

  const handleRemoveLanguage = (langToRemove: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      languages: prev.languages.filter((lang: string) => lang !== langToRemove),
    }));
  };

  const handleSubmit = () => {
    // TODO: Implement API call to update profile
    console.log('Updated profile:', formData);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[5],
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          bgcolor: theme.palette.primary.main,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Edit Profile
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Avatar Upload */}
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={profile.avatar}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  border: `4px solid ${theme.palette.primary.main}`,
                }}
              />
              <Button
                component="label"
                variant="contained"
                startIcon={<UploadIcon />}
                sx={{
                  position: 'absolute',
                  bottom: 24,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderRadius: 4,
                }}
              >
                Upload
                <VisuallyHiddenInput type="file" accept="image/*" />
              </Button>
            </Box>
          </Grid>

          {/* Basic Information */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </Grid>

          {/* Role and Location */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          </Grid>

          {/* Bio */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              variant="outlined"
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
          </Grid>

          {/* Education */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Education"
              name="education"
              value={formData.education}
              onChange={handleInputChange}
              variant="outlined"
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
          </Grid>

          {/* Experience */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Experience"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              variant="outlined"
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
          </Grid>

          {/* Specializations */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              Specializations
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {formData.specializations.map((spec: string) => (
                <Chip
                  key={spec}
                  label={spec}
                  onDelete={() => handleRemoveSpecialization(spec)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Add Specialization"
                name="newSpecialization"
                value={formData.newSpecialization}
                onChange={handleInputChange}
                variant="outlined"
              />
              <Button
                variant="contained"
                onClick={handleAddSpecialization}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
          </Grid>

          {/* Languages */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              Languages
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {formData.languages.map((lang: string) => (
                <Chip
                  key={lang}
                  label={lang}
                  onDelete={() => handleRemoveLanguage(lang)}
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Add Language"
                name="newLanguage"
                value={formData.newLanguage}
                onChange={handleInputChange}
                variant="outlined"
              />
              <Button
                variant="contained"
                onClick={handleAddLanguage}
                startIcon={<AddIcon />}
                color="secondary"
              >
                Add
              </Button>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileEditDialog;
