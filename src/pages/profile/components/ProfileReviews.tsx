import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  Avatar,
  Card,
  CardContent,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ThumbUp as ThumbUpIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../../store';
import {
  fetchReviews,
  markReviewHelpful,
  selectFilteredReviews,
  setReviewFilters,
  resetReviewFilters,
} from '../../../store/slices/profileSlice';
import { useAuth } from '../../../hooks/useAuth';
import FilterDrawer, { FilterOption } from '../../../components/filters/FilterDrawer';
import FilterChip from '../../../components/filters/FilterChip';

interface Review {
  _id: string;
  subject: string;
  date: string;
  rating: number;
  text: string;
  helpfulCount: number;
  isHelpful: boolean;
}

const ProfileReviews = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const reviews = useSelector(selectFilteredReviews);
  const filters = useSelector((state: any) => state.profile.reviews.filters);
  const loading = useSelector((state: any) => state.profile.loading.reviews);
  const error = useSelector((state: any) => state.profile.error.reviews);

  const filterOptions: FilterOption[] = [
    {
      type: 'checkbox',
      label: 'Rating',
      key: 'rating',
      options: [
        { label: '5 Stars', value: '5' },
        { label: '4 Stars', value: '4' },
        { label: '3 Stars', value: '3' },
        { label: '2 Stars', value: '2' },
        { label: '1 Star', value: '1' },
      ],
    },
    {
      type: 'checkbox',
      label: 'Case Type',
      key: 'caseType',
      options: [
        { label: 'Civil', value: 'civil' },
        { label: 'Criminal', value: 'criminal' },
        { label: 'Corporate', value: 'corporate' },
        { label: 'Family', value: 'family' },
      ],
    },
    {
      type: 'date',
      label: 'From Date',
      key: 'dateRange.start',
    },
    {
      type: 'date',
      label: 'To Date',
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
      dispatch(setReviewFilters({
        [keys[0]]: {
          ...filters[keys[0]],
          [keys[1]]: value,
        },
      }));
    } else {
      dispatch(setReviewFilters({ [key]: value }));
    }
  };

  const handleFilterApply = () => {
    setFilterDrawerOpen(false);
  };

  const handleFilterReset = () => {
    dispatch(resetReviewFilters());
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.rating.length) count++;
    if (filters.caseType.length) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.search) count++;
    return count;
  };

  const renderActiveFilters = () => {
    const activeFilters = [];

    if (filters.rating.length) {
      activeFilters.push(
        <FilterChip
          key="rating"
          label={`Rating: ${filters.rating.join(', ')} Stars`}
          onDelete={() => handleFilterChange('rating', [])}
        />
      );
    }

    if (filters.caseType.length) {
      activeFilters.push(
        <FilterChip
          key="caseType"
          label={`Case Type: ${filters.caseType.join(', ')}`}
          onDelete={() => handleFilterChange('caseType', [])}
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
      dispatch(fetchReviews(user.id));
    }
  }, [dispatch, user]);

  const handleMarkHelpful = (reviewId: string) => {
    const userId = user?.id;
    if (userId) {
      dispatch(markReviewHelpful({ userId, reviewId }));
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress />
    </Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>
      {error}
    </Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h2">
          Reviews ({reviews.length})
        </Typography>
        <Tooltip title="Filter reviews">
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

      <Stack spacing={2}>
        {reviews.map((review: Review) => (
          <Box key={review._id} sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6">{review.subject}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(review.date).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {review.text}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                startIcon={<ThumbUpIcon />}
                size="small"
                onClick={() => handleMarkHelpful(review._id)}
                disabled={review.isHelpful}
                sx={{ textTransform: 'none' }}
              >
                {review.helpfulCount || 0} found this helpful
              </Button>
            </Box>
          </Box>
        ))}
      </Stack>

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Reviews"
        filters={filterOptions}
        values={filters}
        onChange={handleFilterChange}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />
    </Box>
  );
};

export default ProfileReviews;
