import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  register,
  login,
  logout,
  getCurrentUser,
} from '../../store/slices/authSlice';
import { AuthState } from '../../types/auth';
import { RootState } from '../../store/store';

// Mock user data
const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'client' as const,
};

// Mock store setup
const setupStore = (preloadedState?: Partial<AuthState>) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: preloadedState ? { auth: preloadedState } : undefined,
  });
};

describe('auth slice', () => {
  describe('reducers', () => {
    test('should handle initial state', () => {
      const store = setupStore();
      const state = store.getState() as RootState;
      expect(state.auth).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    });

    test('should handle logout', () => {
      const store = setupStore({
        user: mockUser,
        token: 'token',
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      store.dispatch(logout());
      const state = store.getState() as RootState;
      expect(state.auth).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    });
  });

  describe('async thunks', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    test('register should handle successful registration', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockUser,
          token: 'token123',
        }),
      });

      const store = setupStore();
      await store.dispatch(register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'client',
        phone: '1234567890',
      }));

      const state = store.getState() as RootState;
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.error).toBeNull();
    });

    test('login should handle successful login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockUser,
          token: 'token123',
        }),
      });

      const store = setupStore();
      await store.dispatch(login({
        email: 'test@example.com',
        password: 'password123',
      }));

      const state = store.getState() as RootState;
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.error).toBeNull();
    });

    test('getCurrentUser should handle successful fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const store = setupStore({
        token: 'token123',
      });

      await store.dispatch(getCurrentUser());

      const state = store.getState() as RootState;
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.error).toBeNull();
    });

    test('getCurrentUser should handle no token', async () => {
      const store = setupStore();

      await store.dispatch(getCurrentUser());

      const state = store.getState() as RootState;
      expect(state.auth.user).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.error).toBe('No token found');
    });
  });
});
