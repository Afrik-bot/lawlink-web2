import { API_BASE_URL } from '../config';
import jwtDecode from 'jwt-decode';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface RegisterData {
  email: string;
  password: string;
  role: 'client' | 'consultant';
  profile: {
    firstName: string;
    lastName: string;
  };
}

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    profile: {
      firstName: string;
      lastName: string;
      avatarUrl?: string;
      phoneNumber?: string;
      timezone?: string;
      language?: string;
    };
    preferences?: {
      notifications: boolean;
      theme: 'light' | 'dark' | 'system';
      emailUpdates: boolean;
    };
  };
  message: string;
}

interface ResetPasswordResponse {
  message: string;
}

class AuthService {
  private baseUrl = `${API_BASE_URL}/api`;
  private refreshTokenTimeout?: NodeJS.Timeout;
  private loginAttempts: { [key: string]: { count: number; timestamp: number } } = {};
  private MAX_LOGIN_ATTEMPTS = 5;
  private LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private TOKEN_KEY = 'lawlink_token';
  private REFRESH_TOKEN_KEY = 'lawlink_refresh_token';
  private USER_KEY = 'lawlink_user';
  private PREFERENCES_KEY = 'lawlink_preferences';
  private tokenKey = 'lawlink_token';

  constructor() {
    // Initialize token refresh on service instantiation
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.startRefreshTokenTimer(refreshToken);
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return firebaseOnAuthStateChanged(auth, callback);
  }

  async login({ email, password, rememberMe = false }: LoginData): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      const refreshToken = userCredential.user.refreshToken;
      
      // Store tokens
      localStorage.setItem(this.TOKEN_KEY, token);
      if (rememberMe) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      }

      return {
        token,
        refreshToken,
        user: {
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          role: 'client', // You might want to get this from custom claims
          emailVerified: userCredential.user.emailVerified,
          profile: {
            firstName: userCredential.user.displayName?.split(' ')[0] || '',
            lastName: userCredential.user.displayName?.split(' ')[1] || '',
            avatarUrl: userCredential.user.photoURL || undefined,
          }
        },
        message: 'Login successful'
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Update profile
      await updateProfile(userCredential.user, {
        displayName: `${data.profile.firstName} ${data.profile.lastName}`
      });

      const token = await userCredential.user.getIdToken();
      const refreshToken = userCredential.user.refreshToken;

      return {
        token,
        refreshToken,
        user: {
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          role: data.role,
          emailVerified: userCredential.user.emailVerified,
          profile: {
            firstName: data.profile.firstName,
            lastName: data.profile.lastName
          }
        },
        message: 'Registration successful'
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.PREFERENCES_KEY);
      this.stopRefreshTokenTimer();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async resetPassword(email: string): Promise<ResetPasswordResponse> {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        message: 'Password reset email sent successfully'
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  private startRefreshTokenTimer(refreshToken: string) {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    this.refreshTokenTimeout = setTimeout(async () => {
      try {
        await this.refreshToken(refreshToken);
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.logout();
      }
    }, 25 * 60 * 1000);
  }

  private stopRefreshTokenTimer() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  private async refreshToken(refreshToken: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (user) {
        const newToken = await user.getIdToken(true);
        localStorage.setItem(this.TOKEN_KEY, newToken);
        this.startRefreshTokenTimer(refreshToken);
      }
    } catch (error) {
      throw error;
    }
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
}

export const authService = new AuthService();
