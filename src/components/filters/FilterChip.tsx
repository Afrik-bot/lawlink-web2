import React from 'react';
import { Chip, useTheme } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface FilterChipProps {
  label: string;
  onDelete: () => void;
  color?: 'primary' | 'secondary' | 'default';
}

const FilterChip: React.FC<FilterChipProps> = ({ label, onDelete, color = 'primary' }) => {
  const theme = useTheme();

  return (
    <Chip
      label={label}
      onDelete={onDelete}
      deleteIcon={<CloseIcon />}
      sx={{
        m: 0.5,
        '& .MuiChip-deleteIcon': {
          color: color === 'default' ? theme.palette.grey[500] : 'inherit',
        },
      }}
      color={color}
      size="small"
    />
  );
};

export default FilterChip;
