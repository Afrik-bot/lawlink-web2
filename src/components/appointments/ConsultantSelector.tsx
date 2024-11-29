import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Avatar,
  Typography,
  Grid,
  Card,
  CardContent,
  Rating,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profileService';

export interface Consultant {
  id: string;
  firstName: string;
  lastName: string;
  specialties: string[];
  rating: number;
  photoUrl?: string;
  availability?: {
    nextAvailable: Date;
  };
}

interface ConsultantSelectorProps {
  onSelect: (consultant: Consultant) => void;
  selectedId?: string;
}

const ConsultantSelector: React.FC<ConsultantSelectorProps> = ({
  onSelect,
  selectedId,
}) => {
  const [loading, setLoading] = useState(true);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);

  useEffect(() => {
    loadConsultants();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const consultant = consultants.find(c => c.id === selectedId);
      if (consultant) {
        setSelectedConsultant(consultant);
      }
    }
  }, [selectedId, consultants]);

  const loadConsultants = async () => {
    try {
      setLoading(true);
      // TODO: Implement pagination and filters
      const response = await profileService.getConsultants({
        specialties: [],
        availability: true,
        rating: true,
      });
      setConsultants(response);
    } catch (error) {
      console.error('Error loading consultants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsultantSelect = (consultant: Consultant | null) => {
    setSelectedConsultant(consultant);
    if (consultant) {
      onSelect(consultant);
    }
  };

  const filterOptions = (options: Consultant[], { inputValue }: { inputValue: string }) => {
    const searchTerms = inputValue.toLowerCase().split(' ');
    return options.filter((option) => {
      const fullName = `${option.firstName} ${option.lastName}`.toLowerCase();
      const specialties = option.specialties.join(' ').toLowerCase();
      return searchTerms.every(term => 
        fullName.includes(term) || specialties.includes(term)
      );
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Autocomplete
        value={selectedConsultant}
        onChange={(_, newValue) => handleConsultantSelect(newValue)}
        options={consultants}
        getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
        filterOptions={filterOptions}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search Consultants"
            placeholder="Search by name or specialty"
            variant="outlined"
            fullWidth
          />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Avatar
                  src={option.photoUrl}
                  alt={`${option.firstName} ${option.lastName}`}
                  sx={{ width: 40, height: 40 }}
                />
              </Grid>
              <Grid item xs>
                <Typography variant="subtitle1">
                  {option.firstName} {option.lastName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating value={option.rating} readOnly size="small" />
                  <Typography variant="body2" color="text.secondary">
                    ({option.rating.toFixed(1)})
                  </Typography>
                </Box>
                <Box sx={{ mt: 0.5 }}>
                  {option.specialties.map((specialty) => (
                    <Chip
                      key={specialty}
                      label={specialty}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </Grid>
              {option.availability?.nextAvailable && (
                <Grid item>
                  <Typography variant="caption" color="text.secondary">
                    Next available:{' '}
                    {new Date(option.availability.nextAvailable).toLocaleDateString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </li>
        )}
      />

      {selectedConsultant && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item>
                <Avatar
                  src={selectedConsultant.photoUrl}
                  alt={`${selectedConsultant.firstName} ${selectedConsultant.lastName}`}
                  sx={{ width: 60, height: 60 }}
                />
              </Grid>
              <Grid item xs>
                <Typography variant="h6">
                  {selectedConsultant.firstName} {selectedConsultant.lastName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Rating value={selectedConsultant.rating} readOnly />
                  <Typography variant="body2" color="text.secondary">
                    ({selectedConsultant.rating.toFixed(1)})
                  </Typography>
                </Box>
                <Box>
                  {selectedConsultant.specialties.map((specialty) => (
                    <Chip
                      key={specialty}
                      label={specialty}
                      sx={{ mr: 0.5 }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ConsultantSelector;
