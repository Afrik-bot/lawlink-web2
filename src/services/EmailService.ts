import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export async function sendEmail(emailData: EmailData): Promise<void> {
  try {
    const functions = getFunctions();
    const sendEmailFunction = httpsCallable(functions, 'sendEmail');
    await sendEmailFunction(emailData);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
