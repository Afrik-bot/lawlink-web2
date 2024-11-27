import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  useTheme,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  TextField,
  Stack,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

export interface FilterOption {
  type: 'checkbox' | 'radio' | 'date' | 'text';
  label: string;
  key: string;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  filters: FilterOption[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onApply: () => void;
  onReset: () => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onClose,
  title,
  filters,
  values,
  onChange,
  onApply,
  onReset,
}) => {
  const theme = useTheme();

  const handleCheckboxChange = (key: string, value: string) => {
    const currentValues = values[key] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    onChange(key, newValues);
  };

  const handleDateChange = (key: string, date: Dayjs | null) => {
    onChange(key, date ? date.toDate() : null);
  };

  const renderFilterInput = (filter: FilterOption) => {
    switch (filter.type) {
      case 'checkbox':
        return (
          <FormGroup>
            {filter.options?.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={(values[filter.key] || []).includes(option.value)}
                    onChange={() => handleCheckboxChange(filter.key, option.value)}
                  />
                }
                label={option.label}
              />
            ))}
          </FormGroup>
        );

      case 'radio':
        return (
          <RadioGroup
            value={values[filter.key] || ''}
            onChange={(e) => onChange(filter.key, e.target.value)}
          >
            {filter.options?.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={values[filter.key] || null}
              onChange={(date) => {
                if (date) {
                  handleDateChange(filter.key, date);
                } else {
                  handleDateChange(filter.key, null);
                }
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  placeholder: filter.placeholder,
                },
              }}
            />
          </LocalizationProvider>
        );

      case 'text':
        return (
          <TextField
            fullWidth
            size="small"
            value={values[filter.key] || ''}
            onChange={(e) => onChange(filter.key, e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 320,
          p: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={3}>
        {filters.map((filter) => (
          <Box key={filter.key} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {filter.label}
            </Typography>
            {renderFilterInput(filter)}
          </Box>
        ))}
      </Stack>

      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          bgcolor: 'background.paper',
          pt: 2,
          mt: 'auto',
        }}
      >
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={onReset} fullWidth>
            Reset
          </Button>
          <Button variant="contained" onClick={onApply} fullWidth>
            Apply Filters
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default FilterDrawer;
