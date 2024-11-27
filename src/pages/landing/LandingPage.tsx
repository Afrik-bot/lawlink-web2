import React, { Suspense, lazy } from 'react';
import { Box, Container, Typography, Button, useTheme, useMediaQuery, Grid, Paper, ButtonProps, alpha, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { Balance, Gavel, Security } from '@mui/icons-material';
import Footer from '../../components/Footer';

const SubscriptionManager = lazy(() => import('../../components/Pricing/SubscriptionManager'));

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.primary,
  textAlign: 'center',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      linear-gradient(135deg, 
        ${alpha('#1B365D', 0.05)} 0%,
        ${alpha(theme.palette.background.paper, 0.98)} 50%,
        ${alpha('#7C3030', 0.05)} 100%
      )
    `,
    zIndex: 1,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url(/images/subtle-pattern.png) repeat',
    opacity: 0.03,
    zIndex: 0,
  },
}));

const Logo = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(4),
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 3,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    top: theme.spacing(2),
  },
}));

const LogoIcon = styled('div')(({ theme }) => ({
  background: '#1B365D',
  borderRadius: '8px',
  padding: '4px 8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}));

const LogoLetters = styled(Typography)(({ theme }) => ({
  fontFamily: 'Poppins, sans-serif',
  fontSize: '24px',
  fontWeight: 700,
  color: '#fff',
  letterSpacing: '0px',
  lineHeight: 1,
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontFamily: 'Poppins, sans-serif',
  fontSize: '24px',
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginLeft: theme.spacing(1.5),
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

const StyledButton = styled(Button)<StyledButtonProps>(({ theme }) => ({
  borderRadius: 28,
  padding: '10px 24px',
  fontSize: '1rem',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
}));

const HeroImage = styled('img')(({ theme }) => ({
  position: 'absolute',
  right: '5%',
  top: '50%',
  transform: 'translateY(-50%)',
  maxWidth: '45%',
  height: 'auto',
  zIndex: 2,
  animation: 'float 6s ease-in-out infinite',
  '@keyframes float': {
    '0%, 100%': {
      transform: 'translateY(-50%) translateX(0)',
    },
    '50%': {
      transform: 'translateY(-52%) translateX(-10px)',
    },
  },
  [theme.breakpoints.down('md')]: {
    position: 'relative',
    right: 'auto',
    top: 'auto',
    transform: 'none',
    maxWidth: '80%',
    margin: '2rem auto',
  },
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

interface StyledButtonProps extends ButtonProps {
  to?: string;
}

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      title: 'Expert Legal Guidance',
      description: 'Connect with experienced attorneys who provide personalized legal consultation tailored to your needs.',
      icon: <Balance sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />,
    },
    {
      title: 'Secure & Confidential',
      description: 'Your privacy is our priority. All communications are protected by attorney-client privilege.',
      icon: <Security sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />,
    },
    {
      title: 'Efficient Resolution',
      description: 'Get timely responses and practical solutions to your legal matters from qualified professionals.',
      icon: <Gavel sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />,
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HeroSection>
        <Logo>
          <LogoIcon>
            <LogoLetters>LL</LogoLetters>
          </LogoIcon>
          <LogoText>LawLink</LogoText>
        </Logo>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box textAlign={isMobile ? 'center' : 'left'}>
                <Typography
                  variant="h1"
                  gutterBottom
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  Legal Expertise at Your Fingertips
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 4,
                    lineHeight: 1.6,
                  }}
                >
                  Connect with qualified legal professionals for personalized consultation and guidance in a secure, confidential environment.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: isMobile ? 'center' : 'flex-start', mt: 4 }}>
                  <Button
                    component={RouterLink}
                    to="/register"
                    variant="contained"
                    size="large"
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 500,
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="outlined"
                    size="large"
                    sx={{
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 500,
                    }}
                  >
                    Sign In
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <HeroImage
                src="/images/legal-hero.svg"
                alt="Legal Consultation"
              />
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      <Box sx={{ py: 12, bgcolor: 'background.default', flex: 1 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{ mb: 8, color: theme.palette.text.primary }}
          >
            Why Choose LawLink
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <FeatureCard elevation={2}>
                  {feature.icon}
                  <Typography variant="h4" gutterBottom sx={{ color: theme.palette.text.primary }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    {feature.description}
                  </Typography>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: 12, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            gutterBottom
            sx={{ mb: 8, color: theme.palette.text.primary }}
          >
            Choose Your Plan
          </Typography>
          <Suspense 
            fallback={
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
              </Box>
            }
          >
            <SubscriptionManager />
          </Suspense>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default LandingPage;
