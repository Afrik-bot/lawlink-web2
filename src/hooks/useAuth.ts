import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { login, register, logoutAction, clearError } from '../store/slices/authSlice';
import { LoginData, RegisterData } from '../types/auth';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const handleLogin = useCallback(async (data: LoginData) => {
    try {
      await dispatch(login({ ...data, rememberMe: data.rememberMe ?? false })).unwrap();
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const handleRegister = useCallback(async (data: RegisterData) => {
    try {
      await dispatch(register({ ...data, rememberMe: data.rememberMe ?? false })).unwrap();
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const handleLogout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    ...auth,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError: handleClearError,
  };
};

export default useAuth;
