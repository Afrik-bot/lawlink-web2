import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button, Snackbar, Alert } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import axios from 'axios';

const VAPID_PUBLIC_KEY = 'BMfV_qOVLfmEP7kjEeJZRaNP-VIR48YWlgk4RF0HRwRoDRloG2rSDwwGAmqOYu5Jma7uXNJ5CJGpjnam87KZmnI';

interface NotificationManagerProps {
  onSubscriptionChange?: (subscription: PushSubscription | null) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ 
  onSubscriptionChange 
}) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications are not supported');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
      onSubscriptionChange?.(existingSubscription);
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToNotifications = async () => {
    try {
      setIsSubscribing(true);

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported');
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send subscription to backend
      await axios.post('/api/notifications/subscribe', {
        userId: user?.id,
        subscription: pushSubscription
      });

      setSubscription(pushSubscription);
      onSubscriptionChange?.(pushSubscription);
      setNotification({
        message: 'Successfully subscribed to notifications',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      setNotification({
        message: 'Failed to subscribe to notifications',
        severity: 'error'
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribeFromNotifications = async () => {
    try {
      if (!subscription) return;

      await subscription.unsubscribe();
      
      // Notify backend about unsubscription
      await axios.post('/api/notifications/unsubscribe', {
        userId: user?.id
      });

      setSubscription(null);
      onSubscriptionChange?.(null);
      setNotification({
        message: 'Successfully unsubscribed from notifications',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      setNotification({
        message: 'Failed to unsubscribe from notifications',
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  return (
    <>
      <Button
        variant="outlined"
        color={subscription ? 'primary' : 'secondary'}
        onClick={subscription ? unsubscribeFromNotifications : subscribeToNotifications}
        startIcon={subscription ? <NotificationsIcon /> : <NotificationsOffIcon />}
        disabled={isSubscribing}
      >
        {subscription ? 'Disable Notifications' : 'Enable Notifications'}
      </Button>

      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification && (
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </>
  );
};
