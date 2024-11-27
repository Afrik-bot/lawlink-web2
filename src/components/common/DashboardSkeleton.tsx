import React from 'react';
import { Box, Skeleton, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const SkeletonContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
}));

const DashboardSkeleton: React.FC = () => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="rectangular" width="30%" height={40} />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width="60%" />
        </Box>
      </Box>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <SkeletonContainer>
              <Skeleton variant="rectangular" height={120} />
              <Box sx={{ pt: 2 }}>
                <Skeleton variant="text" />
                <Skeleton variant="text" width="60%" />
              </Box>
            </SkeletonContainer>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Section */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          <SkeletonContainer>
            <Skeleton variant="rectangular" height={300} />
            <Box sx={{ pt: 2 }}>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" width="80%" />
            </Box>
          </SkeletonContainer>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          <SkeletonContainer>
            <Skeleton variant="rectangular" height={200} />
            <Box sx={{ pt: 2 }}>
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} variant="text" />
              ))}
            </Box>
          </SkeletonContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardSkeleton;
