import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Badge,
  Box,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { chatService, Conversation } from '../../services/chatService';

interface ChatListProps {
  selectedConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  selectedConversationId,
  onConversationSelect,
}) => {
  const theme = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {conversations.map((conversation) => {
        const otherParticipant = conversation.participants.find(
          id => id !== localStorage.getItem('userId')
        );

        return (
          <ListItem
            key={conversation._id}
            button
            selected={conversation._id === selectedConversationId}
            onClick={() => onConversationSelect(conversation)}
            sx={{
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                },
              },
            }}
          >
            <ListItemAvatar>
              <Badge
                color="primary"
                badgeContent={conversation.unreadCount}
                invisible={!conversation.unreadCount}
              >
                <Avatar>{otherParticipant?.[0]?.toUpperCase()}</Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={otherParticipant}
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{
                      display: 'inline',
                      fontWeight: conversation.unreadCount ? 600 : 400,
                    }}
                  >
                    {conversation.lastMessage?.content}
                  </Typography>
                  {conversation.lastMessage && (
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), {
                        addSuffix: true,
                      })}
                    </Typography>
                  )}
                </React.Fragment>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export default ChatList;
