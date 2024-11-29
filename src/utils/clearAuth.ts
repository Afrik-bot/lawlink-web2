import { auth } from '../config/firebase';
import { signOut, Auth } from 'firebase/auth';

export const clearAuthState = async (authInstance: Auth = auth) => {
  try {
    // Sign out from Firebase
    await signOut(authInstance);
    
    // Clear local storage
    localStorage.clear();
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log('Auth state cleared successfully');
  } catch (error) {
    console.error('Error clearing auth state:', error);
    throw error;
  }
};
