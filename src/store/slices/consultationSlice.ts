import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

interface SharedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface ConsultationState {
  id: string | null;
  status: 'idle' | 'connecting' | 'active' | 'ended';
  participants: {
    client: string | null;
    consultant: string | null;
  };
  messages: Message[];
  sharedFiles: SharedFile[];
  error: string | null;
  loading: boolean;
}

const initialState: ConsultationState = {
  id: null,
  status: 'idle',
  participants: {
    client: null,
    consultant: null,
  },
  messages: [],
  sharedFiles: [],
  error: null,
  loading: false,
};

// Async thunks
export const startConsultation = createAsyncThunk(
  'consultation/start',
  async (consultationId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/consultations/${consultationId}/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start consultation');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const endConsultation = createAsyncThunk(
  'consultation/end',
  async (consultationId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/consultations/${consultationId}/end`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to end consultation');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchConsultationHistory = createAsyncThunk(
  'consultation/fetchHistory',
  async (consultationId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/consultations/${consultationId}/history`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch consultation history');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

const consultationSlice = createSlice({
  name: 'consultation',
  initialState,
  reducers: {
    setConsultationId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    addSharedFile: (state, action: PayloadAction<SharedFile>) => {
      state.sharedFiles.push(action.payload);
    },
    setParticipants: (state, action: PayloadAction<{ client: string; consultant: string }>) => {
      state.participants = action.payload;
    },
    setStatus: (state, action: PayloadAction<ConsultationState['status']>) => {
      state.status = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetConsultation: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Start consultation
      .addCase(startConsultation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startConsultation.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'active';
        state.id = action.payload.id;
        state.participants = action.payload.participants;
      })
      .addCase(startConsultation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // End consultation
      .addCase(endConsultation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(endConsultation.fulfilled, (state) => {
        state.loading = false;
        state.status = 'ended';
      })
      .addCase(endConsultation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch consultation history
      .addCase(fetchConsultationHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConsultationHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;
        state.sharedFiles = action.payload.sharedFiles;
      })
      .addCase(fetchConsultationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setConsultationId,
  addMessage,
  addSharedFile,
  setParticipants,
  setStatus,
  clearError,
  resetConsultation,
} = consultationSlice.actions;

export default consultationSlice.reducer;
