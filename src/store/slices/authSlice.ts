import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosConfig';
import { sessionManager } from '../../utils/sessionManager';
import { credentialsManager } from '../../utils/credentialsManager';
import { API_BASE_URL } from '../../config';
import { AuthState, LoginData, RegisterData, User, AuthResponse } from '../../types/auth';

// Async thunks
export const register = createAsyncThunk<
  AuthResponse,
  RegisterData & { rememberMe: boolean },
  { rejectValue: string }
>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/auth/register', data);
      if (response.data.token) {
        sessionManager.setToken(response.data.token);
        sessionManager.setUser(response.data.user);
        
        if (data.rememberMe) {
          credentialsManager.saveCredentials(data.email, data.password, true);
        }
      }
      return {
        user: response.data.user,
        token: response.data.token,
        rememberMe: !!data.rememberMe
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.response?.data?.errors?.[0]?.msg || 
                          error.message || 
                          'Registration failed. Please try again.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const login = createAsyncThunk<
  AuthResponse,
  LoginData & { rememberMe: boolean },
  { rejectValue: string }
>(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', data);
      if (response.data.token) {
        sessionManager.setToken(response.data.token);
        sessionManager.setUser(response.data.user);
        
        if (data.rememberMe) {
          credentialsManager.saveCredentials(data.email, data.password, true);
        } else {
          credentialsManager.clearCredentials();
        }
      }
      return {
        user: response.data.user,
        token: response.data.token,
        rememberMe: !!data.rememberMe
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Login failed. Please check your credentials and try again.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    sessionManager.clearSession();
    return null;
  }
);

export const getCurrentUser = createAsyncThunk<User, void>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionManager.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axiosInstance.get('/api/auth/me');
      sessionManager.setUser(response.data);
      return response.data;
    } catch (error: any) {
      sessionManager.clearSession();
      return rejectWithValue('Session expired. Please login again.');
    }
  }
);

export const autoLogin = createAsyncThunk(
  'auth/autoLogin',
  async (_, { dispatch }) => {
    const credentials = credentialsManager.getCredentials();
    if (credentials) {
      return dispatch(login({ ...credentials, rememberMe: true }));
    }
    return null;
  }
);

export const requestPasswordReset = createAsyncThunk<{ message: string }, string>(
  'auth/requestPasswordReset',
  async (email, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to request password reset';
      return rejectWithValue(errorMessage);
    }
  }
);

export const resetPassword = createAsyncThunk<
  { message: string },
  { token: string; newPassword: string }
>(
  'auth/resetPassword',
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/api/auth/reset-password/${token}`, {
        password: newPassword,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  rememberMe: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutAction(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.rememberMe = false;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    setRememberMe(state, action) {
      state.rememberMe = action.payload;
      if (!action.payload) {
        credentialsManager.clearCredentials();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.rememberMe = action.payload.rememberMe;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.rememberMe = action.payload.rememberMe;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.rememberMe = false;
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // Auto Login
      .addCase(autoLogin.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(autoLogin.rejected, (state) => {
        state.rememberMe = false;
        credentialsManager.clearCredentials();
      })
      // Request Password Reset
      .addCase(requestPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logoutAction, setError, clearError, setRememberMe } = authSlice.actions;
export default authSlice.reducer;
