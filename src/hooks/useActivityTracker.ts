import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../utils/sessionManager';
import { useAuth } from './useAuth';

export const useActivityTracker = () => {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();

  const handleActivity = useCallback(() => {
    if (sessionManager.getToken()) {
      sessionManager.updateLastActive();
    }
  }, []);

  const checkSession = useCallback(() => {
    if (sessionManager.getToken() && sessionManager.isSessionExpired()) {
      handleLogout();
      navigate('/login', { 
        state: { 
          message: 'Your session has expired due to inactivity. Please login again.' 
        } 
      });
    }
  }, [handleLogout, navigate]);

  useEffect(() => {
    // Set up activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Set up session check interval
    const intervalId = setInterval(checkSession, 60000); // Check every minute

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [handleActivity, checkSession]);
};
