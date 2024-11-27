import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

export interface PlatformFees {
  transactionFeePercent: number;
  transactionFeeFixed: number;
  subscriptionFeeMonthly: number;
}

export interface ConsultantPricing {
  hourlyRate: number;
  minimumDuration: number; // in minutes
  cancellationFee: number;
  customPackages: {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number; // in minutes
    features: string[];
  }[];
}

export interface Transaction {
  id: string;
  sessionId: string;
  consultantId: string;
  clientId: string;
  amount: number;
  platformFee: number;
  consultantPayout: number;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  paymentIntentId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Subscription {
  id: string;
  consultantId: string;
  plan: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  stripeSubscriptionId: string;
  currentPeriodEnd: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class PaymentService {
  public readonly stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

  private readonly platformFees: PlatformFees = {
    transactionFeePercent: 10, // 10% platform fee
    transactionFeeFixed: 2, // $2 fixed fee per transaction
    subscriptionFeeMonthly: 49, // $49/month subscription fee
  };

  private readonly subscriptionPlans = {
    basic: {
      price: 49,
      features: [
        'Basic profile listing',
        'Up to 10 sessions/month',
        'Standard support',
      ],
    },
    professional: {
      price: 99,
      features: [
        'Featured profile listing',
        'Unlimited sessions',
        'Priority support',
        'Advanced analytics',
        'Custom branding',
      ],
    },
    enterprise: {
      price: 199,
      features: [
        'Premium profile listing',
        'Unlimited sessions',
        '24/7 dedicated support',
        'White-label solution',
        'API access',
        'Custom integrations',
      ],
    },
  };

  async createConsultantPricing(
    consultantId: string,
    pricing: ConsultantPricing
  ): Promise<void> {
    try {
      await setDoc(doc(db, 'consultant_pricing', consultantId), {
        ...pricing,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating consultant pricing:', error);
      throw error;
    }
  }

  async getConsultantPricing(consultantId: string): Promise<ConsultantPricing | null> {
    try {
      const pricingDoc = await getDoc(doc(db, 'consultant_pricing', consultantId));
      return pricingDoc.exists() ? (pricingDoc.data() as ConsultantPricing) : null;
    } catch (error) {
      console.error('Error getting consultant pricing:', error);
      throw error;
    }
  }

  async createPaymentIntent(
    sessionId: string,
    consultantId: string,
    clientId: string,
    amount: number
  ): Promise<string> {
    try {
      // Create payment intent through backend API
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          consultantId,
          clientId,
          amount,
        }),
      });

      const { clientSecret } = await response.json();
      return clientSecret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async createSubscription(
    consultantId: string,
    plan: 'basic' | 'professional' | 'enterprise',
    paymentMethodId: string
  ): Promise<Subscription> {
    try {
      // Create subscription through backend API
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultantId,
          plan,
          paymentMethodId,
        }),
      });

      const subscription = await response.json();
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async getTransactionStats(
    consultantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEarnings: number;
    totalFees: number;
    totalTransactions: number;
    averageTransactionValue: number;
  }> {
    // Implementation for getting transaction statistics
    // This would query the transactions collection and aggregate the data
    throw new Error('Not implemented');
  }

  async handleRefund(
    transactionId: string,
    amount?: number // If not provided, full refund
  ): Promise<void> {
    try {
      const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      // Process refund through backend API
      const response = await fetch('/api/process-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          amount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'refunded',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }
}

const paymentService = new PaymentService();
export default paymentService;
