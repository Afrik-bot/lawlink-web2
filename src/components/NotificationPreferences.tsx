import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { NotificationManager } from './NotificationManager';

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export const NotificationPreferences: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    sms: true,
    push: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await axios.get('/api/users/notification-preferences');
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setNotification({
        message: 'Failed to load notification preferences',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (channel: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put('/api/users/notification-preferences', {
        preferences
      });
      setNotification({
        message: 'Notification preferences saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setNotification({
        message: 'Failed to save notification preferences',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Preferences
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.email}
                onChange={() => handlePreferenceChange('email')}
                disabled={!user?.email}
              />
            }
            label={
              <Box>
                <Typography>Email Notifications</Typography>
                <Typography variant="caption" color="textSecondary">
                  {user?.email || 'No email address provided'}
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.sms}
                onChange={() => handlePreferenceChange('sms')}
                disabled={!user?.phone}
              />
            }
            label={
              <Box>
                <Typography>SMS Notifications</Typography>
                <Typography variant="caption" color="textSecondary">
                  {user?.phone || 'No phone number provided'}
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.push}
                onChange={() => handlePreferenceChange('push')}
              />
            }
            label="Push Notifications"
          />
        </FormGroup>

        <Box mt={2}>
          <NotificationManager
            onSubscriptionChange={(subscription) => {
              if (!subscription && preferences.push) {
                setPreferences(prev => ({
                  ...prev,
                  push: false
                }));
              }
            }}
          />
        </Box>

        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Box>

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
      </CardContent>
    </Card>
  );
};
