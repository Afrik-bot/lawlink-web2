import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  useTheme,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Description as DocumentIcon,
  ArrowForward as ArrowForwardIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchCases, selectFilteredCases, setCaseFilters, resetCaseFilters } from '../../../store/slices/profileSlice';
import { useAuth } from '../../../hooks/useAuth';
import FilterDrawer, { FilterOption } from '../../../components/filters/FilterDrawer';
import FilterChip from '../../../components/filters/FilterChip';

const ProfileCases = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const cases = useSelector(selectFilteredCases);
  const filters = useSelector((state: any) => state.profile.cases.filters);
  const loading = useSelector((state: any) => state.profile.loading.cases);
  const error = useSelector((state: any) => state.profile.error.cases);

  const filterOptions: FilterOption[] = [
    {
      type: 'checkbox',
      label: 'Status',
      key: 'status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Pending', value: 'pending' },
      ],
    },
    {
      type: 'checkbox',
      label: 'Case Type',
      key: 'type',
      options: [
        { label: 'Civil', value: 'civil' },
        { label: 'Criminal', value: 'criminal' },
        { label: 'Corporate', value: 'corporate' },
        { label: 'Family', value: 'family' },
      ],
    },
    {
      type: 'date',
      label: 'Start Date',
      key: 'dateRange.start',
    },
    {
      type: 'date',
      label: 'End Date',
      key: 'dateRange.end',
    },
    {
      type: 'text',
      label: 'Search',
      key: 'search',
    },
  ];

  const handleFilterChange = (key: string, value: any) => {
    const keys = key.split('.');
    if (keys.length === 2) {
      dispatch(setCaseFilters({
        [keys[0]]: {
          ...filters[keys[0]],
          [keys[1]]: value,
        },
      }));
    } else {
      dispatch(setCaseFilters({ [key]: value }));
    }
  };

  const handleFilterApply = () => {
    setFilterDrawerOpen(false);
  };

  const handleFilterReset = () => {
    dispatch(resetCaseFilters());
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status.length) count++;
    if (filters.type.length) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.search) count++;
    return count;
  };

  const renderActiveFilters = () => {
    const activeFilters = [];

    if (filters.status.length) {
      activeFilters.push(
        <FilterChip
          key="status"
          label={`Status: ${filters.status.join(', ')}`}
          onDelete={() => handleFilterChange('status', [])}
        />
      );
    }

    if (filters.type.length) {
      activeFilters.push(
        <FilterChip
          key="type"
          label={`Type: ${filters.type.join(', ')}`}
          onDelete={() => handleFilterChange('type', [])}
        />
      );
    }

    if (filters.dateRange.start || filters.dateRange.end) {
      activeFilters.push(
        <FilterChip
          key="dateRange"
          label={`Date: ${filters.dateRange.start || 'Any'} - ${filters.dateRange.end || 'Any'}`}
          onDelete={() => handleFilterChange('dateRange', { start: null, end: null })}
        />
      );
    }

    if (filters.search) {
      activeFilters.push(
        <FilterChip
          key="search"
          label={`Search: ${filters.search}`}
          onDelete={() => handleFilterChange('search', '')}
        />
      );
    }

    return activeFilters;
  };

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCases(user.id));
    }
  }, [dispatch, user?.id]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_progress':
        return theme.palette.info.main;
      case 'review':
        return theme.palette.warning.main;
      case 'new':
        return theme.palette.success.main;
      case 'completed':
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[500];
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h2">
          Cases ({cases.length})
        </Typography>
        <Tooltip title="Filter cases">
          <IconButton
            onClick={() => setFilterDrawerOpen(true)}
            color={getActiveFilterCount() > 0 ? 'primary' : 'default'}
          >
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {getActiveFilterCount() > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {renderActiveFilters()}
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Cases Overview */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper
                sx={{
                  p: 2,
                  background: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
                  color: 'white',
                  borderRadius: 2,
                  height: '100%',
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                  {cases.filter((case_) => case_.status === 'in_progress').length}
                </Typography>
                <Typography variant="subtitle1">Active Cases</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper
                sx={{
                  p: 2,
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  borderRadius: 2,
                  height: '100%',
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                  {cases.filter((case_) => case_.status === 'completed').length}
                </Typography>
                <Typography variant="subtitle1">Completed Cases</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper
                sx={{
                  p: 2,
                  background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                  color: 'white',
                  borderRadius: 2,
                  height: '100%',
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                  {(cases.filter((case_) => case_.status === 'completed').length / cases.length * 100).toFixed(0)}%
                </Typography>
                <Typography variant="subtitle1">Success Rate</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Active Cases */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.primary.main }}>
            Active Cases
          </Typography>
          <Grid container spacing={2}>
            {cases.map((case_) => (
              <Grid item xs={12} key={case_.id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                          {case_.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {case_.description}
                        </Typography>
                        <Chip
                          label={case_.type}
                          size="small"
                          sx={{
                            mr: 1,
                            bgcolor: theme.palette.primary.main,
                            color: 'white',
                          }}
                        />
                        <Chip
                          label={case_.status}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(case_.status),
                            color: 'white',
                          }}
                        />
                      </Box>
                      <IconButton>
                        <MoreIcon />
                      </IconButton>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Progress
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={case_.progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(0, 0, 0, 0.05)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                          },
                        }}
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              bgcolor: 'rgba(33, 150, 243, 0.1)',
                              color: theme.palette.primary.main,
                              mr: 1,
                            }}
                          >
                            <CalendarIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Timeline
                            </Typography>
                            <Typography variant="body2">
                              {case_.startDate} - {case_.endDate}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              bgcolor: 'rgba(76, 175, 80, 0.1)',
                              color: theme.palette.success.main,
                              mr: 1,
                            }}
                          >
                            <MoneyIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Budget
                            </Typography>
                            <Typography variant="body2">{case_.budget}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              bgcolor: 'rgba(244, 67, 54, 0.1)',
                              color: theme.palette.error.main,
                              mr: 1,
                            }}
                          >
                            <DocumentIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Documents
                            </Typography>
                            <Typography variant="body2">{case_.documents}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          variant="outlined"
                          endIcon={<ArrowForwardIcon />}
                          fullWidth
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            height: '100%',
                          }}
                        >
                          View Details
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Cases"
        filters={filterOptions}
        values={filters}
        onChange={handleFilterChange}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />
    </Box>
  );
};

export default ProfileCases;
