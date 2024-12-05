import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { initialState } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
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

const mockInitialState: AuthState = {
  ...initialState,
  user: mockUser,
  token: 'mock-token',
  isAuthenticated: true,
  rememberMe: false
};

describe('useAuth hook', () => {
  const mockStore = configureStore({
    reducer: {
      auth: authReducer
    },
    preloadedState: {
      auth: mockInitialState
    }
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={mockStore}>
      {children}
    </Provider>
  );

  it('should return the current auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('mock-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.rememberMe).toBe(false);
  });

  it('should handle login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle register', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'client' as UserRole,
        phoneNumber: '1234567890',
        rememberMe: true
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.rememberMe).toBe(false);
  });

  it('should handle error clearing', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
