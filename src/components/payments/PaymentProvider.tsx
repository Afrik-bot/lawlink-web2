import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLIC_KEY, stripeConfig } from '../../config/stripe';

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

interface PaymentProviderProps {
  children: React.ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  return (
    <Elements stripe={stripePromise} options={stripeConfig}>
      {children}
    </Elements>
  );
};

export default PaymentProvider;
