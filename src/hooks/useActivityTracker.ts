import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useActivityTracker = () => {
  const { user } = useAuth();

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      // Set timeout for 30 minutes of inactivity
      inactivityTimer = setTimeout(() => {
        if (user) {
          // Handle inactivity (e.g., logout)
          console.log('User inactive for 30 minutes');
        }
      }, 30 * 60 * 1000);
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Start the initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);
};
