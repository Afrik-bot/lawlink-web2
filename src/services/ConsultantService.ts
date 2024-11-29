import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const LEGAL_SPECIALTIES = {
  DIVORCE: 'Divorce Law',
  FAMILY: 'Family Law',
  CRIMINAL: 'Criminal Law',
  CORPORATE: 'Corporate Law',
  REAL_ESTATE: 'Real Estate Law',
  IMMIGRATION: 'Immigration Law',
  INTELLECTUAL_PROPERTY: 'Intellectual Property',
  EMPLOYMENT: 'Employment Law',
  PERSONAL_INJURY: 'Personal Injury',
  ESTATE_PLANNING: 'Estate Planning',
  BANKRUPTCY: 'Bankruptcy Law',
  TAX: 'Tax Law',
  CIVIL_LITIGATION: 'Civil Litigation',
  CONSTITUTIONAL: 'Constitutional Law',
  ENVIRONMENTAL: 'Environmental Law',
} as const;

export type LegalSpecialty = typeof LEGAL_SPECIALTIES[keyof typeof LEGAL_SPECIALTIES];

export interface ConsultantProfile {
  id: string;
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specializations: LegalSpecialty[];
    yearsOfExperience: number;
    bio: string;
    keywords: string[];
  };
  professionalInfo: {
    licenseNumber: string;
    jurisdiction: string;
    certifications: string[];
    education: {
      institution: string;
      degree: string;
      year: number;
    }[];
  };
  availability: {
    timezone: string;
    defaultSessionDuration: number;
  };
  rating: number;
  reviewCount: number;
  status: 'active' | 'inactive' | 'pending';
  planId: string;
  createdAt: Timestamp;
  featuredUntil?: Timestamp;
}

export interface SearchFilters {
  specialization?: LegalSpecialty[];
  jurisdiction?: string[];
  yearsOfExperience?: number;
  rating?: number;
  availability?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  };
  featured?: boolean;
  sortBy?: 'rating' | 'experience' | 'reviewCount';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResults {
  consultants: ConsultantProfile[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

class ConsultantService {
  private consultantsCollection = collection(db, 'consultants');
  private RESULTS_PER_PAGE = 10;

  async searchConsultants(
    searchTerm: string = '',
    filters: SearchFilters = {},
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<SearchResults> {
    try {
      let q = query(this.consultantsCollection);

      // Base filters
      q = query(q, where('status', '==', 'active'));

      // Prioritize specialization matching
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        
        // Find matching specialties from the search term
        const matchingSpecialties = Object.values(LEGAL_SPECIALTIES).filter(specialty =>
          specialty.toLowerCase().includes(searchLower)
        );

        if (matchingSpecialties.length > 0) {
          // If we found matching specialties, search by those
          q = query(
            q,
            where('personalInfo.specializations', 'array-contains-any', matchingSpecialties)
          );
        } else {
          // If no specialty matches, search by keywords
          q = query(
            q,
            where('personalInfo.keywords', 'array-contains', searchLower)
          );
        }
      }

      // Apply specialty filters if explicitly set
      if (filters.specialization?.length) {
        q = query(
          q,
          where('personalInfo.specializations', 'array-contains-any', filters.specialization)
        );
      }

      // Apply filters
      if (filters.jurisdiction?.length) {
        q = query(
          q,
          where('professionalInfo.jurisdiction', 'in', filters.jurisdiction)
        );
      }

      if (filters.yearsOfExperience) {
        q = query(
          q,
          where('personalInfo.yearsOfExperience', '>=', filters.yearsOfExperience)
        );
      }

      if (filters.rating) {
        q = query(q, where('rating', '>=', filters.rating));
      }

      if (filters.featured) {
        q = query(
          q,
          where('featuredUntil', '>', Timestamp.now())
        );
      }

      // Sorting
      const sortField = filters.sortBy || 'rating';
      const sortDirection = filters.sortOrder || 'desc';
      q = query(q, orderBy(sortField, sortDirection));

      // Pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      q = query(q, limit(this.RESULTS_PER_PAGE + 1));

      const snapshot = await getDocs(q);
      const hasMore = snapshot.docs.length > this.RESULTS_PER_PAGE;
      const consultants = snapshot.docs
        .slice(0, this.RESULTS_PER_PAGE)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ConsultantProfile));

      return {
        consultants,
        lastDoc: hasMore ? snapshot.docs[this.RESULTS_PER_PAGE - 1] : null,
        hasMore,
      };
    } catch (error) {
      console.error('Error searching consultants:', error);
      throw error;
    }
  }

  async getAvailableSpecializations(): Promise<LegalSpecialty[]> {
    // Return predefined specialties instead of querying
    return Object.values(LEGAL_SPECIALTIES);
  }

  async getAvailableJurisdictions(): Promise<string[]> {
    try {
      const snapshot = await getDocs(
        query(
          this.consultantsCollection,
          where('status', '==', 'active'),
          orderBy('professionalInfo.jurisdiction')
        )
      );

      const jurisdictions = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.professionalInfo?.jurisdiction) {
          jurisdictions.add(data.professionalInfo.jurisdiction);
        }
      });

      return Array.from(jurisdictions);
    } catch (error) {
      console.error('Error getting jurisdictions:', error);
      throw error;
    }
  }

  async getConsultantById(consultantId: string): Promise<ConsultantProfile | null> {
    try {
      const snapshot = await getDocs(
        query(this.consultantsCollection, where('id', '==', consultantId))
      );

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as ConsultantProfile;
    } catch (error) {
      console.error('Error getting consultant:', error);
      throw error;
    }
  }

  async getFeaturedConsultants(limit: number = 4): Promise<ConsultantProfile[]> {
    try {
      const snapshot = await getDocs(
        query(
          this.consultantsCollection,
          where('status', '==', 'active'),
          where('featuredUntil', '>', Timestamp.now()),
          orderBy('featuredUntil'),
          orderBy('rating', 'desc'),
          limit
        )
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ConsultantProfile));
    } catch (error) {
      console.error('Error getting featured consultants:', error);
      throw error;
    }
  }
}

export default new ConsultantService();
