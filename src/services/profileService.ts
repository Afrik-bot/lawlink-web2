import axios from 'axios';
import { API_BASE_URL } from '../config';

// Types
export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'consultant';
  avatar: string;
  location: string;
  rating: number;
  reviewCount: number;
  specializations: string[];
  languages: string[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  experience: {
    position: string;
    company: string;
    period: string;
  }[];
  bio: string;
}

export interface Case {
  id: number;
  title: string;
  client: string;
  status: 'new' | 'in_progress' | 'review' | 'completed';
  outcome?: 'success' | 'failure' | 'pending';
  progress: number;
  createdAt: string;
  startDate: string;
  endDate: string;
  budget: string;
  documents: number;
  description: string;
  type: string;
}

export interface Review {
  id: number;
  client: {
    name: string;
    avatar: string;
    company: string;
  };
  rating: number;
  createdAt: string;
  comment: string;
  caseType: string;
  helpful: number;
}

export interface RatingStats {
  average: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface CaseStats {
  active: number;
  completed: number;
  successRate: number;
}

class ProfileService {
  private baseUrl = `${API_BASE_URL}/profile`;

  // Profile
  async getProfile(userId: string): Promise<Profile> {
    try {
      const response = await axios.get<Profile>(`${this.baseUrl}/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  }

  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    try {
      const response = await axios.put<Profile>(`${this.baseUrl}/${userId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  // Cases
  async getCases(userId: string): Promise<Case[]> {
    try {
      const response = await axios.get<Case[]>(`${this.baseUrl}/${userId}/cases`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cases');
    }
  }

  async getCaseDetails(userId: string, caseId: number): Promise<Case> {
    try {
      const response = await axios.get<Case>(`${this.baseUrl}/${userId}/cases/${caseId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch case details');
    }
  }

  // Reviews
  async getReviews(userId: string): Promise<{ reviews: Review[]; stats: RatingStats }> {
    try {
      const response = await axios.get<{ reviews: Review[]; stats: RatingStats }>(`${this.baseUrl}/${userId}/reviews`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }

  async markReviewHelpful(userId: string, reviewId: number): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/${userId}/reviews/${reviewId}/helpful`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark review as helpful');
    }
  }
}

export const profileService = new ProfileService();
