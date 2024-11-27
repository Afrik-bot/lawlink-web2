import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ApplicationVerifier,
  User as FirebaseUser,
  fetchSignInMethodsForEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  signInWithCredential,
  PhoneAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { googleProvider } from '../config/googleAuth';
import { RegisterData, User, UserRole, DEFAULT_USER_DATA } from '../types/auth';

interface AuthHookReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  handleRegister: (data: RegisterData) => Promise<boolean>;
  handleEmailLogin: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  handleGoogleLogin: () => Promise<boolean>;
  handlePhoneLogin: (phoneNumber: string) => Promise<string>;
  confirmPhoneLogin: (verificationId: string, code: string) => Promise<boolean>;
  handleLogout: () => Promise<void>;
  handlePasswordReset: (email: string) => Promise<boolean>;
  handlePasswordResetConfirm: (oobCode: string, newPassword: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<{ user: User }>;
  updateUserProfile: (userId: string, data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const createUserData = (
  firebaseUser: FirebaseUser,
  role: UserRole = 'client',
  additionalData: Partial<User> = {}
): User => ({
  ...DEFAULT_USER_DATA,
  ...additionalData,
  uid: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName || `${additionalData.firstName || ''} ${additionalData.lastName || ''}`.trim(),
  photoURL: firebaseUser.photoURL,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const useAuth = (): AuthHookReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      await updateUserState(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserState = async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      setUser(null);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const docData = userDoc.data() as User | undefined;

      if (userDoc.exists() && docData) {
        // Update existing user data
        const userData: User = {
          uid: docData.uid,
          email: docData.email,
          firstName: docData.firstName,
          lastName: docData.lastName,
          displayName: docData.displayName,
          role: docData.role,
          photoURL: docData.photoURL,
          phoneNumber: docData.phoneNumber,
          barNumber: docData.barNumber,
          legalCredentials: docData.legalCredentials,
          createdAt: docData.createdAt,
          updatedAt: docData.updatedAt,
        };

        if (firebaseUser.displayName && firebaseUser.displayName !== userData.displayName) {
          const displayNameParts = firebaseUser.displayName.split(' ');
          const updates = {
            displayName: firebaseUser.displayName,
            firstName: displayNameParts[0],
            lastName: displayNameParts.slice(1).join(' '),
            updatedAt: new Date().toISOString()
          };
          await updateDoc(doc(db, 'users', firebaseUser.uid), updates);
          Object.assign(userData, updates);
        }
        setUser(userData);
      } else {
        // Create new user
        const displayNameParts = firebaseUser.displayName?.split(' ') || ['', ''];
        const newUserData = createUserData(firebaseUser, 'client', {
          firstName: displayNameParts[0],
          lastName: displayNameParts.slice(1).join(' '),
          photoURL: firebaseUser.photoURL || null,
        });
        await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
        setUser(newUserData);
      }
    } catch (error) {
      console.error('Error updating user state:', error);
      setError(getFirebaseErrorMessage(error));
    }
  };

  const handleRegister = async (data: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Check if email already exists
      const methods = await fetchSignInMethodsForEmail(auth, data.email);
      if (methods.length > 0) {
        throw new Error('Email already exists');
      }

      // Create user with email and password
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Create user data
      const userData: User = {
        uid: firebaseUser.uid,
        email: data.email,
        displayName: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phoneNumber: data.phoneNumber || null,
        barNumber: data.barNumber || null,
        legalCredentials: data.legalCredentials,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photoURL: firebaseUser.photoURL || null
      };

      // Save user data to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      // Update user state
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setError(getFirebaseErrorMessage(error));
      setLoading(false);
      return false;
    }
  };

  const handleEmailLogin = async (email: string, password: string, rememberMe: boolean = true): Promise<boolean> => {
    try {
      setError(null);
      // Set persistence based on remember me option
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      await updateUserState(firebaseUser);
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(getFirebaseErrorMessage(err));
      return false;
    }
  };

  const handleGoogleLogin = async (): Promise<boolean> => {
    try {
      setError(null);
      // Always use local persistence for Google login
      await setPersistence(auth, browserLocalPersistence);
      
      const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
      await updateUserState(firebaseUser);
      return true;
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(getFirebaseErrorMessage(err));
      return false;
    }
  };

  const handlePhoneLogin = async (phoneNumber: string): Promise<string> => {
    try {
      setError(null);
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult.verificationId;
    } catch (err: any) {
      console.error('Phone login error:', err);
      setError(getFirebaseErrorMessage(err));
      throw err;
    }
  };

  const confirmPhoneLogin = async (verificationId: string, code: string): Promise<boolean> => {
    try {
      setError(null);
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const { user: firebaseUser } = await signInWithCredential(auth, credential);
      await updateUserState(firebaseUser);
      return true;
    } catch (err: any) {
      console.error('Phone confirmation error:', err);
      setError(getFirebaseErrorMessage(err));
      return false;
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
      setError(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(getFirebaseErrorMessage(err));
    }
  };

  const handlePasswordReset = async (email: string): Promise<boolean> => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(getFirebaseErrorMessage(err));
      return false;
    }
  };

  const handlePasswordResetConfirm = async (oobCode: string, newPassword: string): Promise<boolean> => {
    try {
      setError(null);
      await confirmPasswordReset(auth, oobCode, newPassword);
      return true;
    } catch (err: any) {
      console.error('Password reset confirmation error:', err);
      setError(getFirebaseErrorMessage(err));
      return false;
    }
  };

  const signUp = async (email: string, password: string): Promise<{ user: User }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userData: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: '',
        firstName: '',
        lastName: '',
        role: 'consultant',
        phoneNumber: null,
        barNumber: null,
        legalCredentials: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      return { user: userData };
    } catch (error: any) {
      console.error('Error in signUp:', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const updateUserProfile = async (userId: string, data: Partial<User>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const checkAuth = async (): Promise<void> => {
    try {
      setLoading(true);
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
            setIsAuthenticated(true);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      });
      unsubscribe(); // Call unsubscribe immediately after setting up the listener
    } catch (error) {
      console.error('Error checking auth state:', error);
      setError(getFirebaseErrorMessage(error));
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    handleRegister,
    handleEmailLogin,
    handleGoogleLogin,
    handlePhoneLogin,
    confirmPhoneLogin,
    handleLogout,
    handlePasswordReset,
    handlePasswordResetConfirm,
    signUp,
    updateUserProfile,
    checkAuth,
  };
};

const getFirebaseErrorMessage = (error: any): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please try logging in instead.';
    case 'auth/invalid-email':
      return 'The email address is invalid. Please check and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'The password is too weak. Please choose a stronger password.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please check and try again.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign in popup was closed before completing. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Only one popup sign in request allowed at a time.';
    case 'auth/popup-blocked':
      return 'Sign in popup was blocked by your browser. Please allow popups for this site.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};
