import { SubscriptionPlan } from '../config/subscriptionPlans';

interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  name: string;
}

export class MockPaymentService {
  async processPayment(plan: SubscriptionPlan, paymentDetails: PaymentDetails): Promise<boolean> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Accept any test card number that passes Luhn algorithm
    const isValidCard = this.validateTestCard(paymentDetails.cardNumber);
    
    if (!isValidCard) {
      throw new Error('Invalid test card number');
    }

    // Always return success for test cards
    return true;
  }

  private validateTestCard(cardNumber: string): boolean {
    // Accept common test card numbers
    const testCards = [
      '4242424242424242', // Visa
      '5555555555554444', // Mastercard
      '378282246310005',  // American Express
    ];

    return testCards.includes(cardNumber.replace(/\s/g, ''));
  }
}

export const mockPaymentService = new MockPaymentService();
