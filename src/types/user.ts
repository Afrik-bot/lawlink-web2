export type UserRole = 'client' | 'consultant' | 'admin';

export interface LegalCredentials {
  barNumber: string;
  jurisdiction: string;
  specializations: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber: string;
  legalCredentials?: LegalCredentials;
  profileCompleted?: boolean;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  timezone: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
}
