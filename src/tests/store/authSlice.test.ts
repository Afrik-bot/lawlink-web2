import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  initialState,
  login,
  register,
  logout,
  setError,
  clearError
} from '../../store/slices/authSlice';
import { AuthState, User, UserRole } from '../../types/auth';

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'client' as UserRole,
  phoneNumber: '1234567890',
  profileCompleted: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('auth slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: initialState }
    });

    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should handle initial state', () => {
    expect(store.getState().auth).toEqual(initialState);
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user: mockUser,
          token: 'mock-token'
        })
      });

      await store.dispatch(login({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      }));

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('mock-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.rememberMe).toBe(true);
    });

    it('should handle login failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' })
      });

      await store.dispatch(login({
        email: 'test@example.com',
        password: 'wrong-password',
        rememberMe: false
      }));

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
      expect(state.rememberMe).toBe(false);
    });
  });

  describe('register', () => {
    it('should handle successful registration', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          user: mockUser,
          token: 'mock-token'
        })
      });

      await store.dispatch(register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'client' as UserRole,
        phoneNumber: '1234567890',
        rememberMe: true
      }));

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('mock-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.rememberMe).toBe(true);
    });

    it('should handle registration failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Email already exists' })
      });

      await store.dispatch(register({
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'client' as UserRole,
        phoneNumber: '1234567890',
        rememberMe: false
      }));

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Email already exists');
      expect(state.rememberMe).toBe(false);
    });
  });

  describe('logout', () => {
    it('should handle logout', () => {
      store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
          auth: {
            ...initialState,
            user: mockUser,
            token: 'mock-token',
            isAuthenticated: true,
            rememberMe: true
          }
        }
      });

      store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.rememberMe).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should set error', () => {
      store.dispatch(setError('Test error'));

      const state = store.getState().auth;
      expect(state.error).toBe('Test error');
    });

    it('should clear error', () => {
      store.dispatch(setError('Test error'));
      store.dispatch(clearError());

      const state = store.getState().auth;
      expect(state.error).toBeNull();
    });
  });
});
