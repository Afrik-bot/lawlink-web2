import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged, 
  Auth,
  signInAnonymously,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  enableMultiTabIndexedDbPersistence, 
  Firestore 
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Log environment info (without sensitive data)
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  hasMeasurementId: !!firebaseConfig.measurementId,
});

// Initialize Firebase app
console.log('Initializing Firebase app...');
const app = initializeApp(firebaseConfig);

// Initialize services
console.log('Initializing Firebase services...');
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
let analytics: Analytics | undefined;

// Only initialize analytics in production
if (process.env.NODE_ENV === 'production') {
  analytics = getAnalytics(app);
}

// Enable offline persistence for Firestore
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.log('Multiple tabs open, persistence enabled in first tab only');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.log('Current browser does not support persistence');
    }
  });
}

export { app, auth, db, storage, analytics };
