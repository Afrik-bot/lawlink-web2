import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const FirebaseTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing connection...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Try to fetch documents from users collection
        const querySnapshot = await getDocs(collection(db, 'users'));
        setStatus(`Connection successful! Found ${querySnapshot.size} users.`);
      } catch (error: any) {
        console.error('Firebase connection error:', error);
        setStatus(`Connection error: ${error.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Firebase Connection Status</h3>
      <p>{status}</p>
    </div>
  );
};

export default FirebaseTest;
