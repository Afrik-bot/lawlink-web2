import { Timestamp } from 'firebase/firestore';

declare module '*.svg' {
  const content: any;
  export default content;
}

declare global {
  interface Window {
    Stripe: any;
  }
}

export interface AuthContextType {
  currentUser: any;
  user: any;
  loading: boolean;
  error: string | null;
  handleEmailLogin: (email: string, password: string) => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleRegister: (data: any) => Promise<void>;
  handlePasswordReset: (email: string) => Promise<void>;
}

export interface LayoutProps {
  children: React.ReactNode;
}

export const LEGAL_SPECIALTIES = {
  CORPORATE: 'Corporate Law',
  CRIMINAL: 'Criminal Law',
  FAMILY: 'Family Law',
  IMMIGRATION: 'Immigration Law',
  INTELLECTUAL_PROPERTY: 'Intellectual Property',
  REAL_ESTATE: 'Real Estate Law',
  TAX: 'Tax Law',
  EMPLOYMENT: 'Employment Law',
  ENVIRONMENTAL: 'Environmental Law',
  CIVIL_RIGHTS: 'Civil Rights Law'
} as const;

export type LegalSpecialty = typeof LEGAL_SPECIALTIES[keyof typeof LEGAL_SPECIALTIES];
