import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material';

declare module '@mui/material/styles' {
  interface Palette {
    neutral: Palette['primary'];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1B365D', // Rich navy blue
      light: '#2C4B7C',
      dark: '#0F2440',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7C3030', // Deep burgundy red
      light: '#994444',
      dark: '#5F2424',
      contrastText: '#FFFFFF',
    },
    neutral: {
      main: '#4A4A4A',
      light: '#6E6E6E',
      dark: '#2E2E2E',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#923838',
      light: '#B54747',
      dark: '#702A2A',
    },
    warning: {
      main: '#8B6E42',
      light: '#A88B5F',
      dark: '#6E5634',
    },
    info: {
      main: '#385C92',
      light: '#4B73AD',
      dark: '#2A4570',
    },
    success: {
      main: '#446E44',
      light: '#588958',
      dark: '#355435',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#333333',
      disabled: alpha('#1A1A1A', 0.38),
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    divider: alpha('#1A1A1A', 0.12),
  },
  typography: {
    fontFamily: "'Libre Baskerville', 'Cormorant Garamond', serif",
    h1: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 600,
      fontSize: '3rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 600,
      fontSize: '2.5rem',
      lineHeight: 1.3,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h4: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 500,
      fontSize: '1.5rem',
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    h6: {
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.6,
      letterSpacing: '0.0075em',
    },
    subtitle1: {
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.75,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.75,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01071em',
    },
    button: {
      fontFamily: "'Libre Baskerville', serif",
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          padding: '8px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '4px',
          },
        },
      },
    },
  },
});

export { theme };
export default theme;
