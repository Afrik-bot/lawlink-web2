import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton, useTheme } from '@mui/material';
import { Facebook, Twitter, LinkedIn, Instagram } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  const theme = useTheme();

  const footerLinks = {
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Contact', path: '/contact' },
      { name: 'Careers', path: '/careers' },
      { name: 'Blog', path: '/blog' },
    ],
    legal: [
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Cookie Policy', path: '/cookies' },
      { name: 'Legal Notice', path: '/legal-notice' },
    ],
    services: [
      { name: 'Legal Consultation', path: '/services/consultation' },
      { name: 'Document Review', path: '/services/document-review' },
      { name: 'Case Management', path: '/services/case-management' },
      { name: 'Legal Resources', path: '/resources' },
    ],
  };

  const socialLinks = [
    { icon: <Facebook />, url: 'https://facebook.com' },
    { icon: <Twitter />, url: 'https://twitter.com' },
    { icon: <LinkedIn />, url: 'https://linkedin.com' },
    { icon: <Instagram />, url: 'https://instagram.com' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: theme.palette.primary.main,
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              LawLink
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
              Connecting you with legal expertise through innovative technology.
            </Typography>
            <Box sx={{ mt: 2 }}>
              {socialLinks.map((social, index) => (
                <IconButton
                  key={index}
                  component="a"
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      color: 'white',
                    },
                    mr: 1,
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={4}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Company
                </Typography>
                {footerLinks.company.map((link, index) => (
                  <Link
                    key={index}
                    component={RouterLink}
                    to={link.path}
                    sx={{
                      display: 'block',
                      color: 'rgba(255, 255, 255, 0.7)',
                      mb: 1,
                      '&:hover': {
                        color: 'white',
                        textDecoration: 'none',
                      },
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Legal
                </Typography>
                {footerLinks.legal.map((link, index) => (
                  <Link
                    key={index}
                    component={RouterLink}
                    to={link.path}
                    sx={{
                      display: 'block',
                      color: 'rgba(255, 255, 255, 0.7)',
                      mb: 1,
                      '&:hover': {
                        color: 'white',
                        textDecoration: 'none',
                      },
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Services
                </Typography>
                {footerLinks.services.map((link, index) => (
                  <Link
                    key={index}
                    component={RouterLink}
                    to={link.path}
                    sx={{
                      display: 'block',
                      color: 'rgba(255, 255, 255, 0.7)',
                      mb: 1,
                      '&:hover': {
                        color: 'white',
                        textDecoration: 'none',
                      },
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Box
          sx={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            mt: 6,
            pt: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            © {new Date().getFullYear()} LawLink. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
