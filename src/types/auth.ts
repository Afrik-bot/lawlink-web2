export type UserRole = 'client' | 'consultant' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber: string | null;
  barNumber: string | null;
  legalCredentials: string;
  createdAt: string;
  updatedAt: string;
  photoURL: string | null;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  barNumber?: string;
  legalCredentials: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface PhoneLoginData {
  phoneNumber: string;
  verificationCode: string;
}

export interface PhoneVerificationData {
  verificationId: string;
  code: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Default values for new users
export const DEFAULT_USER_DATA: Omit<User, 'uid' | 'email'> = {
  displayName: 'New User',
  firstName: 'New',
  lastName: 'User',
  role: 'client',
  phoneNumber: null,
  barNumber: null,
  legalCredentials: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  photoURL: null,
};
