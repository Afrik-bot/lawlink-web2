export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  recommended?: boolean;
}

export const legalConsultantPlans: SubscriptionPlan[] = [
  {
    id: 'basic-monthly',
    name: 'Basic',
    price: 29.99,
    period: 'monthly',
    features: [
      'Up to 50 client consultations/month',
      'Basic document management',
      'Email support',
      'Video consultations'
    ]
  },
  {
    id: 'professional-monthly',
    name: 'Professional',
    price: 79.99,
    period: 'monthly',
    recommended: true,
    features: [
      'Unlimited client consultations',
      'Advanced document management',
      'Priority support',
      'Video consultations',
      'Client portal access',
      'Custom branding'
    ]
  },
  {
    id: 'enterprise-monthly',
    name: 'Enterprise',
    price: 199.99,
    period: 'monthly',
    features: [
      'All Professional features',
      'Multi-user access',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced analytics'
    ]
  }
];
