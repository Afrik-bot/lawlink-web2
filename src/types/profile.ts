export interface Education {
  degree: string;
  institution: string;
  year: number;
}

export interface Experience {
  position: string;
  company: string;
  period: string;
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  role: 'client' | 'consultant';
  location: string;
  avatar?: string;
  specializations: string[];
  languages: string[];
  education: string;
  experience: string;
  certifications: string[];
  successRate?: number;
}
