import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  EventNote as EventIcon,
  Description as DocumentIcon,
  Gavel as CaseIcon,
  Info as SystemIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  MarkEmailRead as ReadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

interface Notification {
  _id: string;
  type: 'appointment' | 'document' | 'case' | 'system';
  title: string;
  body: string;
  channels: string[];
  status: 'sent' | 'failed' | 'pending';
  read: boolean;
  createdAt: string;
  metadata: {
    appointmentId?: any;
    documentId?: any;
    caseId?: any;
  };
}

interface NotificationHistoryProps {
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({
  onNotificationClick
}) => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    type: 'all',
    read: 'all'
  });

  useEffect(() => {
    loadNotifications();
  }, [page, filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.read !== 'all') params.append('read', filter.read === 'read' ? 'true' : 'false');

      const response = await axios.get(`/api/notifications/history?${params.toString()}`);
      setNotifications(response.data.notifications);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await axios.post(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.post('/api/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <EventIcon />;
      case 'document':
        return <DocumentIcon />;
      case 'case':
        return <CaseIcon />;
      default:
        return <SystemIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return theme.palette.success.main;
      case 'failed':
        return theme.palette.error.main;
      default:
        return theme.palette.warning.main;
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  if (loading && page === 1) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Notification History</Typography>
          <Button
            variant="outlined"
            onClick={handleMarkAllAsRead}
            startIcon={<ReadIcon />}
          >
            Mark All as Read
          </Button>
        </Box>

        <Stack direction="row" spacing={2} mb={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filter.type}
              label="Type"
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="appointment">Appointments</MenuItem>
              <MenuItem value="document">Documents</MenuItem>
              <MenuItem value="case">Cases</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filter.read}
              label="Status"
              onChange={(e) => setFilter(prev => ({ ...prev, read: e.target.value }))}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="unread">Unread</MenuItem>
              <MenuItem value="read">Read</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <List>
          {notifications.map((notification) => (
            <ListItem
              key={notification._id}
              sx={{
                bgcolor: notification.read ? 'transparent' : theme.palette.action.hover,
                borderRadius: 1,
                mb: 1
              }}
              secondaryAction={
                !notification.read && (
                  <IconButton
                    edge="end"
                    onClick={() => handleMarkAsRead(notification._id)}
                    title="Mark as read"
                  >
                    <ReadIcon />
                  </IconButton>
                )
              }
            >
              <ListItemIcon>
                {getNotificationIcon(notification.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1">
                      {notification.title}
                    </Typography>
                    <Chip
                      size="small"
                      icon={notification.status === 'sent' ? <CheckIcon /> : <ErrorIcon />}
                      label={notification.status}
                      sx={{
                        bgcolor: getStatusColor(notification.status) + '20',
                        color: getStatusColor(notification.status),
                        borderRadius: 1
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {notification.body}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(notification.createdAt)} via {notification.channels.join(', ')}
                    </Typography>
                  </Box>
                }
                onClick={() => onNotificationClick?.(notification)}
                sx={{ cursor: onNotificationClick ? 'pointer' : 'default' }}
              />
            </ListItem>
          ))}
        </List>

        {notifications.length === 0 && (
          <Box textAlign="center" py={3}>
            <Typography color="text.secondary">
              No notifications found
            </Typography>
          </Box>
        )}

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
