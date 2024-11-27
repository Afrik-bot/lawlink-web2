import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from '../../hooks/useAuth';
import authReducer from '../../store/slices/authSlice';

const mockStore = configureStore({
  reducer: {
    auth: authReducer,
  },
});

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={mockStore}>{children}</Provider>
);

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    mockStore.dispatch({ type: 'auth/logout' });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const success = await result.current.handleLogin('test@example.com', 'password123');
      expect(success).toBe(true);
    });
  });

  it('should handle register', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const success = await result.current.handleRegister({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'client',
        phone: '1234567890',
      });
      expect(success).toBe(true);
    });
  });

  it('should handle logout', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.handleLogout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
