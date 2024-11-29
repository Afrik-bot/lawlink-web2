import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Typography,
  Grid,
  Button,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { RecurringPattern } from '../../services/AppointmentService';

interface RecurringAppointmentFormProps {
  onSubmit: (pattern: RecurringPattern) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const RecurringAppointmentForm: React.FC<RecurringAppointmentFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [interval, setInterval] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [endType, setEndType] = useState<'date' | 'occurrences'>('occurrences');
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [occurrences, setOccurrences] = useState(4);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    try {
      if (endType === 'date' && !endDate) {
        throw new Error('Please select an end date');
      }

      if (frequency === 'weekly' && daysOfWeek.length === 0) {
        throw new Error('Please select at least one day of the week');
      }

      const pattern: RecurringPattern = {
        frequency,
        interval,
        ...(frequency === 'weekly' && { daysOfWeek }),
        ...(endType === 'date' ? { endDate } : { occurrences }),
      };

      onSubmit(pattern);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDayToggle = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Repeat Frequency</FormLabel>
            <RadioGroup
              row
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as typeof frequency)}
            >
              <FormControlLabel value="daily" control={<Radio />} label="Daily" />
              <FormControlLabel value="weekly" control={<Radio />} label="Weekly" />
              <FormControlLabel value="monthly" control={<Radio />} label="Monthly" />
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <FormLabel>Repeat every</FormLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <TextField
                type="number"
                value={interval}
                onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1 }}
                sx={{ width: 100 }}
              />
              <Typography>
                {frequency === 'daily' && 'days'}
                {frequency === 'weekly' && 'weeks'}
                {frequency === 'monthly' && 'months'}
              </Typography>
            </Box>
          </FormControl>
        </Grid>

        {frequency === 'weekly' && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <FormLabel>Repeat on</FormLabel>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {DAYS_OF_WEEK.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={daysOfWeek.includes(day.value)}
                        onChange={() => handleDayToggle(day.value)}
                      />
                    }
                    label={day.label}
                  />
                ))}
              </Box>
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormLabel component="legend">End</FormLabel>
            <RadioGroup
              value={endType}
              onChange={(e) => setEndType(e.target.value as typeof endType)}
            >
              <FormControlLabel
                value="occurrences"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>After</Typography>
                    <TextField
                      type="number"
                      value={occurrences}
                      onChange={(e) => setOccurrences(Math.max(1, parseInt(e.target.value) || 1))}
                      disabled={endType !== 'occurrences'}
                      inputProps={{ min: 1 }}
                      sx={{ width: 80 }}
                    />
                    <Typography>occurrences</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="date"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>On date</Typography>
                    <DatePicker
                      value={endDate}
                      onChange={(date) => setEndDate(date)}
                      disabled={endType !== 'date'}
                      slotProps={{
                        textField: {
                          size: 'small',
                          sx: { width: 200 },
                        },
                      }}
                    />
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
            >
              Save
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecurringAppointmentForm;
