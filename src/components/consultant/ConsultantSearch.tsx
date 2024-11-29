import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Autocomplete,
  Chip,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Rating,
  Skeleton,
  Alert,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { debounce } from 'lodash';
import consultantService, {
  ConsultantProfile,
  SearchFilters,
  LEGAL_SPECIALTIES,
  LegalSpecialty,
} from '../../services/ConsultantService';
import ConsultantSearchFilters from './ConsultantSearchFilters';
import ConsultantCard from './ConsultantCard';

const ConsultantSearch: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [consultants, setConsultants] = useState<ConsultantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [jurisdictions, setJurisdictions] = useState<string[]>([]);
  const [featuredConsultants, setFeaturedConsultants] = useState<ConsultantProfile[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [specs, juris, featured] = await Promise.all([
        consultantService.getAvailableSpecializations(),
        consultantService.getAvailableJurisdictions(),
        consultantService.getFeaturedConsultants(),
      ]);

      setSpecializations(specs);
      setJurisdictions(juris);
      setFeaturedConsultants(featured);

      await searchConsultants();
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load initial data');
    }
  };

  const searchConsultants = async (isLoadMore: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const results = await consultantService.searchConsultants(
        searchTerm,
        filters,
        isLoadMore ? lastDoc : undefined
      );

      setConsultants(prev => 
        isLoadMore ? [...prev, ...results.consultants] : results.consultants
      );
      setLastDoc(results.lastDoc);
      setHasMore(results.hasMore);
    } catch (error) {
      console.error('Error searching consultants:', error);
      setError('Failed to search consultants');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(() => {
    searchConsultants();
  }, 300);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    debouncedSearch();
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    searchConsultants();
  };

  const handleLoadMore = () => {
    searchConsultants(true);
  };

  const renderFeaturedConsultants = () => {
    if (!featuredConsultants.length) return null;

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Featured Consultants
        </Typography>
        <Grid container spacing={2}>
          {featuredConsultants.map(consultant => (
            <Grid item xs={12} sm={6} md={3} key={consultant.id}>
              <ConsultantCard
                consultant={consultant}
                featured
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderSpecialtyChips = () => {
    const commonSpecialties = [
      LEGAL_SPECIALTIES.DIVORCE,
      LEGAL_SPECIALTIES.FAMILY,
      LEGAL_SPECIALTIES.CRIMINAL,
      LEGAL_SPECIALTIES.CORPORATE,
      LEGAL_SPECIALTIES.REAL_ESTATE,
    ];

    return (
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {commonSpecialties.map((specialty) => (
          <Chip
            key={specialty}
            label={specialty}
            onClick={() => {
              setSearchTerm(specialty);
              searchConsultants();
            }}
            sx={{
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
              },
            }}
          />
        ))}
      </Box>
    );
  };

  const renderSearchResults = () => {
    if (loading && !consultants.length) {
      return (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={200} />
                  <Skeleton variant="text" sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!consultants.length) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No consultants found matching your criteria
          </Typography>
        </Box>
      );
    }

    return (
      <>
        <Grid container spacing={2}>
          {consultants.map(consultant => (
            <Grid item xs={12} sm={6} md={4} key={consultant.id}>
              <ConsultantCard consultant={consultant} />
            </Grid>
          ))}
        </Grid>

        {hasMore && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </Box>
        )}
      </>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Search Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Find a Legal Consultant
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Connect with experienced legal professionals for expert consultation
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by legal specialty (e.g., Divorce Law, Family Law)..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            variant="outlined"
            onClick={() => setDrawerOpen(true)}
            startIcon={<FilterIcon />}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Filters
          </Button>
          <IconButton
            sx={{ display: { xs: 'flex', sm: 'none' } }}
            onClick={() => setDrawerOpen(true)}
          >
            <FilterIcon />
          </IconButton>
        </Box>

        {/* Common Specialties Chips */}
        {!searchTerm && renderSpecialtyChips()}

        {Object.keys(filters).length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.specialization?.map(spec => (
              <Chip
                key={spec}
                label={spec}
                onDelete={() => {
                  const newFilters = {
                    ...filters,
                    specialization: filters.specialization?.filter(s => s !== spec),
                  };
                  handleFilterChange(newFilters);
                }}
              />
            ))}
            {filters.jurisdiction?.map(jur => (
              <Chip
                key={jur}
                label={jur}
                onDelete={() => {
                  const newFilters = {
                    ...filters,
                    jurisdiction: filters.jurisdiction?.filter(j => j !== jur),
                  };
                  handleFilterChange(newFilters);
                }}
              />
            ))}
            {filters.rating && (
              <Chip
                label={`${filters.rating}+ Stars`}
                onDelete={() => {
                  const { rating, ...newFilters } = filters;
                  handleFilterChange(newFilters);
                }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Featured Consultants */}
      {!searchTerm && !Object.keys(filters).length && renderFeaturedConsultants()}

      {/* Search Results */}
      {renderSearchResults()}

      {/* Filters Drawer */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? 'auto' : 320,
            height: isMobile ? '80vh' : '100%',
          },
        }}
      >
        <ConsultantSearchFilters
          filters={filters}
          onChange={handleFilterChange}
          onClose={() => setDrawerOpen(false)}
          specializations={specializations}
          jurisdictions={jurisdictions}
        />
      </Drawer>
    </Box>
  );
};

export default ConsultantSearch;
