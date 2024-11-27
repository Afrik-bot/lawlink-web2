import React from 'react';
import { Box } from '@mui/material';
import logo from '../assets/images/lawlink-high-resolution-logo-transparent.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white';
}

const Logo: React.FC<LogoProps> = ({ size = 'medium' }) => {
  const sizes = {
    small: {
      width: 180,
      height: 45,
    },
    medium: {
      width: 240,
      height: 60,
    },
    large: {
      width: 320,
      height: 80,
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: sizes[size].height,
        userSelect: 'none',
      }}
    >
      <img
        src={logo}
        alt="LawLink"
        style={{
          width: sizes[size].width,
          height: sizes[size].height,
          objectFit: 'contain',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
      />
    </Box>
  );
};

export default Logo;
