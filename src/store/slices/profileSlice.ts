import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { profileService, Profile, Case, Review, RatingStats } from '../../services/profileService';

interface CaseFilters {
  status: string[];
  type: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  search: string;
}

interface ReviewFilters {
  rating: number[];
  caseType: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  search: string;
}

interface ProfileState {
  profile: Profile | null;
  cases: {
    list: Case[];
    stats: {
      active: number;
      completed: number;
      successRate: number;
    };
    filters: CaseFilters;
  };
  reviews: {
    list: Review[];
    stats: RatingStats;
    filters: ReviewFilters;
  };
  loading: {
    profile: boolean;
    cases: boolean;
    reviews: boolean;
  };
  error: {
    profile: string | null;
    cases: string | null;
    reviews: string | null;
  };
}

const initialState: ProfileState = {
  profile: null,
  cases: {
    list: [],
    stats: {
      active: 0,
      completed: 0,
      successRate: 0,
    },
    filters: {
      status: [],
      type: [],
      dateRange: {
        start: null,
        end: null,
      },
      search: '',
    },
  },
  reviews: {
    list: [],
    stats: {
      average: 0,
      total: 0,
      distribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    },
    filters: {
      rating: [],
      caseType: [],
      dateRange: {
        start: null,
        end: null,
      },
      search: '',
    },
  },
  loading: {
    profile: false,
    cases: false,
    reviews: false,
  },
  error: {
    profile: null,
    cases: null,
    reviews: null,
  },
};

// Async thunks
export const fetchProfile = createAsyncThunk<Profile, string>(
  'profile/fetchProfile',
  async (userId, { rejectWithValue }) => {
    try {
      return await profileService.getProfile(userId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCases = createAsyncThunk<Case[], string>(
  'profile/fetchCases',
  async (userId, { rejectWithValue }) => {
    try {
      return await profileService.getCases(userId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchReviews = createAsyncThunk<{ reviews: Review[]; stats: RatingStats }, string>(
  'profile/fetchReviews',
  async (userId, { rejectWithValue }) => {
    try {
      return await profileService.getReviews(userId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    resetProfileState: (state) => {
      return initialState;
    },
    setCaseFilters: (state, action: PayloadAction<Partial<CaseFilters>>) => {
      state.cases.filters = {
        ...state.cases.filters,
        ...action.payload,
      };
    },
    setReviewFilters: (state, action: PayloadAction<Partial<ReviewFilters>>) => {
      state.reviews.filters = {
        ...state.reviews.filters,
        ...action.payload,
      };
    },
    resetCaseFilters: (state) => {
      state.cases.filters = initialState.cases.filters;
    },
    resetReviewFilters: (state) => {
      state.reviews.filters = initialState.reviews.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      // Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading.profile = true;
        state.error.profile = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.loading.profile = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error.profile = action.payload as string;
      })
      // Cases
      .addCase(fetchCases.pending, (state) => {
        state.loading.cases = true;
        state.error.cases = null;
      })
      .addCase(fetchCases.fulfilled, (state, action: PayloadAction<Case[]>) => {
        state.loading.cases = false;
        state.cases.list = action.payload;
        state.cases.stats = {
          active: action.payload.filter(c => c.status === 'active').length,
          completed: action.payload.filter(c => c.status === 'completed').length,
          successRate: action.payload.filter(c => c.status === 'completed' && c.outcome === 'success').length / 
                      action.payload.filter(c => c.status === 'completed').length * 100 || 0,
        };
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.loading.cases = false;
        state.error.cases = action.payload as string;
      })
      // Reviews
      .addCase(fetchReviews.pending, (state) => {
        state.loading.reviews = true;
        state.error.reviews = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action: PayloadAction<{ reviews: Review[]; stats: RatingStats }>) => {
        state.loading.reviews = false;
        state.reviews.list = action.payload.reviews;
        state.reviews.stats = action.payload.stats;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading.reviews = false;
        state.error.reviews = action.payload as string;
      });
  },
});

export const {
  resetProfileState,
  setCaseFilters,
  setReviewFilters,
  resetCaseFilters,
  resetReviewFilters,
} = profileSlice.actions;

// Selectors
export const selectFilteredCases = (state: { profile: ProfileState }) => {
  const { list, filters } = state.profile.cases;
  return list.filter(c => {
    const matchesStatus = filters.status.length === 0 || filters.status.includes(c.status);
    const matchesType = filters.type.length === 0 || filters.type.includes(c.type);
    const matchesSearch = !filters.search || 
      c.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      c.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesDateRange = (!filters.dateRange.start || new Date(c.createdAt) >= new Date(filters.dateRange.start)) &&
      (!filters.dateRange.end || new Date(c.createdAt) <= new Date(filters.dateRange.end));
    return matchesStatus && matchesType && matchesSearch && matchesDateRange;
  });
};

export const selectFilteredReviews = (state: { profile: ProfileState }) => {
  const { list, filters } = state.profile.reviews;
  return list.filter(r => {
    const matchesRating = filters.rating.length === 0 || filters.rating.includes(r.rating);
    const matchesCaseType = filters.caseType.length === 0 || filters.caseType.includes(r.caseType);
    const matchesSearch = !filters.search || 
      r.comment.toLowerCase().includes(filters.search.toLowerCase());
    const matchesDateRange = (!filters.dateRange.start || new Date(r.createdAt) >= new Date(filters.dateRange.start)) &&
      (!filters.dateRange.end || new Date(r.createdAt) <= new Date(filters.dateRange.end));
    return matchesRating && matchesCaseType && matchesSearch && matchesDateRange;
  });
};

export default profileSlice.reducer;
