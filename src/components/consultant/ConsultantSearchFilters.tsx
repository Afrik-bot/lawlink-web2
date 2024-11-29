import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Slider,
  FormControlLabel,
  Switch,
  Button,
  Autocomplete,
  TextField,
  Rating,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { SearchFilters } from '../../services/ConsultantService';

interface ConsultantSearchFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onClose: () => void;
  specializations: string[];
  jurisdictions: string[];
}

const ConsultantSearchFilters: React.FC<ConsultantSearchFiltersProps> = ({
  filters,
  onChange,
  onClose,
  specializations,
  jurisdictions,
}) => {
  const handleChange = (key: keyof SearchFilters, value: any) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const handleReset = () => {
    onChange({});
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Specializations */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Specializations
          </Typography>
          <Autocomplete
            multiple
            options={specializations}
            value={filters.specialization || []}
            onChange={(_, newValue) => handleChange('specialization', newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select specializations"
                size="small"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <span key={option} {...getTagProps({ index })}>
                  {option}
                </span>
              ))
            }
          />
        </Box>

        {/* Jurisdictions */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Jurisdictions
          </Typography>
          <Autocomplete
            multiple
            options={jurisdictions}
            value={filters.jurisdiction || []}
            onChange={(_, newValue) => handleChange('jurisdiction', newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select jurisdictions"
                size="small"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <span key={option} {...getTagProps({ index })}>
                  {option}
                </span>
              ))
            }
          />
        </Box>

        {/* Years of Experience */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Minimum Years of Experience
          </Typography>
          <Slider
            value={filters.yearsOfExperience || 0}
            onChange={(_, newValue) => handleChange('yearsOfExperience', newValue)}
            min={0}
            max={30}
            step={1}
            marks={[
              { value: 0, label: '0' },
              { value: 10, label: '10' },
              { value: 20, label: '20' },
              { value: 30, label: '30+' },
            ]}
            valueLabelDisplay="auto"
          />
        </Box>

        {/* Rating */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Minimum Rating
          </Typography>
          <Rating
            value={filters.rating || 0}
            onChange={(_, newValue) => handleChange('rating', newValue)}
            precision={0.5}
          />
        </Box>

        {/* Featured Only */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={filters.featured || false}
                onChange={(e) => handleChange('featured', e.target.checked)}
              />
            }
            label="Featured Consultants Only"
          />
        </Box>

        {/* Sort Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Sort By
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { value: 'rating', label: 'Rating' },
              { value: 'experience', label: 'Experience' },
              { value: 'reviewCount', label: 'Reviews' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={filters.sortBy === option.value ? 'contained' : 'outlined'}
                size="small"
                onClick={() =>
                  handleChange('sortBy', filters.sortBy === option.value ? undefined : option.value)
                }
              >
                {option.label}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={handleReset}
          fullWidth
        >
          Reset
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          fullWidth
        >
          Apply
        </Button>
      </Box>
    </Box>
  );
};

export default ConsultantSearchFilters;
