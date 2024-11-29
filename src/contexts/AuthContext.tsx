import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'client' | 'consultant';
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ user: User }>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  handleGoogleLogin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserData = async (uid: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as Partial<User>;
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: userData?.role,
          firstName: userData?.firstName,
          lastName: userData?.lastName,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await getUserData(userCredential.user.uid);
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        role: userData?.role,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
      throw err;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      console.log('Starting Google sign-in...');
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful');
      
      const userData = await getUserData(result.user.uid);
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role: userData?.role,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
      });
      return true;
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      return false;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      };
      setUser(newUser);
      return { user: newUser };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      throw err;
    }
  };

  const register = async (data: any) => {
    try {
      setError(null);
      const { email, password, role, firstName, lastName, ...profileData } = data;
      const { user } = await signUp(email, password);
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        role,
        firstName,
        lastName,
        ...profileData
      });

      // Update local user state
      setUser(prev => prev ? {
        ...prev,
        role,
        firstName,
        lastName,
        ...profileData
      } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      throw err;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setError(null);
      if (!auth.currentUser) throw new Error('No user logged in');
      
      // Update Firebase Auth profile
      await updateFirebaseProfile(auth.currentUser, {
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
      });

      // Update Firestore user data
      if (data.role || data.firstName || data.lastName) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          role: data.role,
          firstName: data.firstName,
          lastName: data.lastName,
        }, { merge: true });
      }
      
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    signUp,
    resetPassword,
    updateProfile,
    handleGoogleLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
