import { API_BASE_URL } from '../config';

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

  constructor() {
    // Initialize token refresh on service instantiation
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.startRefreshTokenTimer(refreshToken);
    }
  }

  private startRefreshTokenTimer(refreshToken: string) {
    // Clear any existing timer
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    // Set timer to refresh 5 minutes before token expiry
    this.refreshTokenTimeout = setTimeout(async () => {
      try {
        await this.refreshToken(refreshToken);
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Handle refresh failure (e.g., logout user)
        this.logout();
      }
    }, 25 * 60 * 1000); // Assuming 30-minute token lifetime, refresh after 25 minutes
  }

  private stopRefreshTokenTimer() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  private checkRateLimit(email: string): boolean {
    const now = Date.now();
    const userAttempts = this.loginAttempts[email];

    if (!userAttempts) {
      this.loginAttempts[email] = { count: 1, timestamp: now };
      return true;
    }

    if (now - userAttempts.timestamp > this.LOCKOUT_DURATION) {
      // Reset if lockout duration has passed
      this.loginAttempts[email] = { count: 1, timestamp: now };
      return true;
    }

    if (userAttempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      throw new Error(`Too many login attempts. Please try again after ${this.LOCKOUT_DURATION / 60000} minutes.`);
    }

    userAttempts.count++;
    return true;
  }

  private async persistUserData(data: AuthResponse, rememberMe: boolean = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.TOKEN_KEY, data.token);
    storage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
    storage.setItem(this.USER_KEY, JSON.stringify(data.user));
    if (data.user.preferences) {
      storage.setItem(this.PREFERENCES_KEY, JSON.stringify(data.user.preferences));
    }
  }

  private clearUserData() {
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
      storage.removeItem(this.USER_KEY);
      storage.removeItem(this.PREFERENCES_KEY);
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Token refresh failed');
      }

      const data = await response.json();
      await this.persistUserData(data);
      this.startRefreshTokenTimer(data.refreshToken);
      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify-email/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Email verification failed');
      }

      return response.json();
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  async resendVerificationEmail(): Promise<{ message: string }> {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${this.baseUrl}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend verification email');
      }

      return response.json();
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      return response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      this.checkRateLimit(data.email);

      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const authResponse = await response.json();
      await this.persistUserData(authResponse, data.rememberMe);
      this.startRefreshTokenTimer(authResponse.refreshToken);
      return authResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<ResetPasswordResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request password reset');
      }

      return response.json();
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      return response.json();
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        }).catch(error => console.error('Logout request failed:', error));
      }
    } finally {
      this.stopRefreshTokenTimer();
      this.clearUserData();
    }
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY) || localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUserData(): AuthResponse['user'] | null {
    const userData = sessionStorage.getItem(this.USER_KEY) || localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  getUserPreferences(): AuthResponse['user']['preferences'] | null {
    const preferences = sessionStorage.getItem(this.PREFERENCES_KEY) || localStorage.getItem(this.PREFERENCES_KEY);
    return preferences ? JSON.parse(preferences) : null;
  }

  async updateUserPreferences(preferences: Partial<AuthResponse['user']['preferences']>): Promise<void> {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${this.baseUrl}/user/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update preferences');
      }

      const currentPreferences = this.getUserPreferences() || {};
      const updatedPreferences = { ...currentPreferences, ...preferences };
      const storage = localStorage.getItem(this.TOKEN_KEY) ? localStorage : sessionStorage;
      storage.setItem(this.PREFERENCES_KEY, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
