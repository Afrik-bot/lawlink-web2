import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  TextField,
  Box,
  IconButton,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import messageService, { Message, Conversation } from '../services/MessageService';

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get userId from URL query params if it exists
  const searchParams = new URLSearchParams(location.search);
  const targetUserId = searchParams.get('userId');

  useEffect(() => {
    const loadConversations = async () => {
      if (!user?.uid) return;
      
      try {
        const userConversations = await messageService.getConversations(user.uid);
        setConversations(userConversations);

        // If targetUserId exists, find or create conversation with that user
        if (targetUserId) {
          const conversationId = await messageService.getOrCreateConversation(user.uid, targetUserId);
          const conversation = userConversations.find(c => c.id === conversationId);
          if (conversation) {
            setSelectedConversation(conversation);
          }
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user, targetUserId]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (selectedConversation?.id) {
      unsubscribe = messageService.subscribeToMessages(
        selectedConversation.id,
        (updatedMessages) => {
          setMessages(updatedMessages);
          // Mark messages as read
          if (user?.uid) {
            messageService.markMessagesAsRead(selectedConversation.id, user.uid);
          }
        }
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedConversation, user]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user?.uid || !selectedConversation || !newMessage.trim()) return;

    try {
      const otherParticipant = selectedConversation.participants.find(id => id !== user.uid);
      if (!otherParticipant) return;

      await messageService.sendMessage(user.uid, otherParticipant, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
          <Typography>{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {conversations
                .filter(conv => {
                  // Add search filtering logic here
                  return true;
                })
                .map((conversation) => (
                  <React.Fragment key={conversation.id}>
                    <ListItem
                      button
                      selected={selectedConversation?.id === conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <ListItemAvatar>
                        <Badge
                          badgeContent={user?.uid ? conversation.unreadCount[user.uid] || 0 : 0}
                          color="primary"
                          invisible={user?.uid ? !(conversation.unreadCount[user.uid] || 0) : true}
                        >
                          <Avatar>
                            {conversation.participants.find(id => id !== user?.uid)?.[0]?.toUpperCase()}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={conversation.participants.find(id => id !== user?.uid)}
                        secondary={conversation.lastMessage?.content}
                        secondaryTypographyProps={{
                          noWrap: true,
                          style: {
                            color: conversation.unreadCount[user?.uid || ''] ? 'primary' : 'inherit',
                          },
                        }}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
            </List>
          </Paper>
        </Grid>

        {/* Messages */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                {/* Messages Container */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.senderId === user?.uid ? 'flex-end' : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: '70%',
                          bgcolor: message.senderId === user?.uid ? 'primary.main' : 'grey.100',
                          color: message.senderId === user?.uid ? 'white' : 'inherit',
                        }}
                      >
                        <Typography variant="body1">{message.content}</Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                          {message.timestamp.toDate().toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Grid container spacing={2}>
                    <Grid item xs>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                      />
                    </Grid>
                    <Grid item>
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <SendIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Select a conversation to start messaging
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Messages;
