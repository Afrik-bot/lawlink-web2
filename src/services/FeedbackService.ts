import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firebaseLimit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

export interface SessionFeedback {
  id: string;
  sessionId: string;
  userId: string;
  role: 'client' | 'consultant';
  rating: number; // 1-5
  communication: number; // 1-5
  expertise: number; // 1-5
  satisfaction: number; // 1-5
  comments: string;
  wouldRecommend: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FeedbackStats {
  averageRating: number;
  totalFeedback: number;
  ratingDistribution: { [key: number]: number };
  averageCommunication: number;
  averageExpertise: number;
  averageSatisfaction: number;
  recommendationRate: number;
}

class FeedbackService {
  private readonly feedbackCollection = 'feedback';

  async submitFeedback(feedback: Omit<SessionFeedback, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const feedbackId = `${feedback.sessionId}_${feedback.userId}`;
      const now = serverTimestamp();

      const feedbackDoc = {
        ...feedback,
        id: feedbackId,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, this.feedbackCollection, feedbackId), feedbackDoc);
      return feedbackId;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async getFeedback(feedbackId: string): Promise<SessionFeedback | null> {
    try {
      const feedbackDoc = await getDoc(doc(db, this.feedbackCollection, feedbackId));
      return feedbackDoc.exists() ? (feedbackDoc.data() as SessionFeedback) : null;
    } catch (error) {
      console.error('Error getting feedback:', error);
      throw error;
    }
  }

  async getSessionFeedback(sessionId: string): Promise<SessionFeedback[]> {
    try {
      const q = query(
        collection(db, this.feedbackCollection),
        where('sessionId', '==', sessionId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as SessionFeedback);
    } catch (error) {
      console.error('Error getting session feedback:', error);
      throw error;
    }
  }

  async getUserFeedback(userId: string, role: 'client' | 'consultant'): Promise<SessionFeedback[]> {
    try {
      const q = query(
        collection(db, this.feedbackCollection),
        where('userId', '==', userId),
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as SessionFeedback);
    } catch (error) {
      console.error('Error getting user feedback:', error);
      throw error;
    }
  }

  async getConsultantStats(consultantId: string): Promise<FeedbackStats> {
    try {
      const q = query(
        collection(db, this.feedbackCollection),
        where('userId', '==', consultantId),
        where('role', '==', 'consultant')
      );

      const snapshot = await getDocs(q);
      const feedback = snapshot.docs.map(doc => doc.data() as SessionFeedback);

      if (feedback.length === 0) {
        return {
          averageRating: 0,
          totalFeedback: 0,
          ratingDistribution: {},
          averageCommunication: 0,
          averageExpertise: 0,
          averageSatisfaction: 0,
          recommendationRate: 0,
        };
      }

      const ratingDistribution: { [key: number]: number } = {};
      let totalRating = 0;
      let totalCommunication = 0;
      let totalExpertise = 0;
      let totalSatisfaction = 0;
      let totalRecommendations = 0;

      feedback.forEach(f => {
        ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
        totalRating += f.rating;
        totalCommunication += f.communication;
        totalExpertise += f.expertise;
        totalSatisfaction += f.satisfaction;
        if (f.wouldRecommend) totalRecommendations++;
      });

      return {
        averageRating: totalRating / feedback.length,
        totalFeedback: feedback.length,
        ratingDistribution,
        averageCommunication: totalCommunication / feedback.length,
        averageExpertise: totalExpertise / feedback.length,
        averageSatisfaction: totalSatisfaction / feedback.length,
        recommendationRate: (totalRecommendations / feedback.length) * 100,
      };
    } catch (error) {
      console.error('Error getting consultant stats:', error);
      throw error;
    }
  }

  async getTopConsultants(limit: number = 10): Promise<{ consultantId: string; stats: FeedbackStats }[]> {
    try {
      const consultantsRef = collection(db, 'users');
      const consultantsSnapshot = await getDocs(
        query(
          consultantsRef,
          where('role', '==', 'consultant'),
          firebaseLimit(limit)
        )
      );

      const consultantStats = await Promise.all(
        consultantsSnapshot.docs.map(async doc => {
          const stats = await this.getConsultantStats(doc.id);
          return { consultantId: doc.id, stats };
        })
      );

      return consultantStats.sort((a, b) => b.stats.averageRating - a.stats.averageRating);
    } catch (error) {
      console.error('Error getting top consultants:', error);
      throw error;
    }
  }
}

const feedbackService = new FeedbackService();
export default feedbackService;
