import { collection, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Plan {
  id: string;
  name: string;
  price: number;
  billingFrequency: 'monthly' | 'yearly';
  features: string[];
  maxClients?: number;
  maxAppointmentsPerMonth?: number;
  includesVideoCall: boolean;
  includesDocumentSharing: boolean;
  includesRecording: boolean;
}

export interface ConsultantRegistration {
  userId: string;
  planId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialization: string;
    yearsOfExperience: number;
    bio: string;
  };
  professionalInfo: {
    licenseNumber?: string;
    jurisdiction?: string;
    certifications?: string[];
    education?: {
      institution: string;
      degree: string;
      year: number;
    }[];
  };
  availability?: {
    timezone: string;
    defaultSessionDuration: number;
  };
}

class PlanService {
  private plansCollection = collection(db, 'plans');
  private consultantsCollection = collection(db, 'consultants');

  async getAllPlans(): Promise<Plan[]> {
    const snapshot = await getDocs(this.plansCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Plan));
  }

  async getPlan(planId: string): Promise<Plan | null> {
    const docRef = doc(this.plansCollection, planId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Plan : null;
  }

  async registerConsultant(registration: ConsultantRegistration): Promise<string> {
    try {
      // Validate plan exists
      const plan = await this.getPlan(registration.planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      // Check if consultant already exists
      const existingConsultant = await getDocs(
        query(this.consultantsCollection, where('userId', '==', registration.userId))
      );
      if (!existingConsultant.empty) {
        throw new Error('Consultant already registered');
      }

      // Create consultant document
      const consultantRef = doc(this.consultantsCollection);
      await setDoc(consultantRef, {
        ...registration,
        createdAt: new Date(),
        status: 'pending', // pending, active, suspended
        stripeCustomerId: null, // Will be set during payment setup
        currentPlanId: registration.planId,
        planStartDate: new Date(),
        settings: {
          allowInstantBooking: false,
          requireApproval: true,
          ...registration.availability,
        }
      });

      return consultantRef.id;
    } catch (error) {
      console.error('Error registering consultant:', error);
      throw error;
    }
  }

  async getConsultantByUserId(userId: string): Promise<any | null> {
    const consultants = await getDocs(
      query(this.consultantsCollection, where('userId', '==', userId))
    );
    
    if (consultants.empty) {
      return null;
    }

    const doc = consultants.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  }

  async activateConsultant(consultantId: string): Promise<void> {
    try {
      const consultantRef = doc(this.consultantsCollection, consultantId);
      await setDoc(consultantRef, {
        status: 'active',
        activatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error activating consultant:', error);
      throw error;
    }
  }
}

export default new PlanService();
