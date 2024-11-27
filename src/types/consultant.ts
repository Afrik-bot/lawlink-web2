export interface Expertise {
  area: string;
  years: number;
  description?: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  description?: string;
}

export interface Review {
  clientId: string;
  rating: number;
  comment?: string;
  date: Date;
}

export interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ConsultationDuration {
  minutes: number;
  price: number;
}

export interface ConsultationSettings {
  durations: ConsultationDuration[];
  isVirtualAvailable: boolean;
  isInPersonAvailable: boolean;
}

export interface Location {
  city?: string;
  state?: string;
  country?: string;
}

export interface Rating {
  average: number;
  count: number;
}

export interface BarAdmission {
  state: string;
  year: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface ProfessionalMembership {
  organization: string;
  role?: string;
  yearJoined: string;
}

export interface ConsultantProfile {
  userId: string;
  title: string;
  bio: string;
  expertise: Expertise[];
  education: Education[];
  languages: string[];
  location: Location;
  consultationSettings: ConsultationSettings;
  availability: Availability[];
  reviews: Review[];
  rating: Rating;
  profileImage?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  specializations: string[];
  yearsOfExperience: number;
  barAdmissions: BarAdmission[];
  professionalMemberships: ProfessionalMembership[];
}
