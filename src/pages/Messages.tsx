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
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: Message[];
}

const Messages = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Placeholder messages data
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      name: 'John Smith',
      lastMessage: 'Thank you for your consultation',
      time: '10:30 AM',
      unread: true,
      messages: [
        {
          id: '1',
          senderId: 'john',
          content: 'Hello, how can I help you today?',
          timestamp: new Date('2024-02-10T10:25:00'),
        },
        {
          id: '2',
          senderId: user?.id || '',
          content: 'I need help with a contract review',
          timestamp: new Date('2024-02-10T10:28:00'),
        },
        {
          id: '3',
          senderId: 'john',
          content: 'Thank you for your consultation',
          timestamp: new Date('2024-02-10T10:30:00'),
        },
      ],
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      lastMessage: 'When can we schedule the next meeting?',
      time: 'Yesterday',
      unread: false,
      messages: [
        {
          id: '1',
          senderId: user?.id || '',
          content: 'Hi Sarah, I wanted to discuss our case',
          timestamp: new Date('2024-02-09T15:20:00'),
        },
        {
          id: '2',
          senderId: 'sarah',
          content: 'When can we schedule the next meeting?',
          timestamp: new Date('2024-02-09T15:25:00'),
        },
      ],
    },
    {
      id: 3,
      name: 'Michael Brown',
      lastMessage: 'I have reviewed the documents',
      time: 'Yesterday',
      unread: false,
      messages: [
        {
          id: '1',
          senderId: 'michael',
          content: 'I have reviewed the documents',
          timestamp: new Date('2024-02-09T14:30:00'),
        },
      ],
    },
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleConversationSelect = (conversation: Conversation) => {
    if (conversation.unread) {
      // Mark conversation as read
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === conversation.id ? { ...conv, unread: false } : conv
        )
      );
    }
    setSelectedConversation(conversation);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const newMessageObj: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user?.id || '',
      content: newMessage.trim(),
      timestamp: new Date(),
    };

    // Update conversation with new message
    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              lastMessage: newMessage.trim(),
              time: 'Just now',
              messages: [...conv.messages, newMessageObj],
            }
          : conv
      )
    );

    // Update selected conversation
    setSelectedConversation(prev =>
      prev ? { ...prev, messages: [...prev.messages, newMessageObj] } : null
    );

    setNewMessage('');
    setTimeout(scrollToBottom, 100);
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);

    if (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return messageDate.toLocaleDateString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Messages
      </Typography>
      <Grid container spacing={3}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                placeholder="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" />,
                }}
                variant="outlined"
                size="small"
              />
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {filteredConversations.map((conversation) => (
                <React.Fragment key={conversation.id}>
                  <ListItem
                    button
                    selected={selectedConversation?.id === conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="primary"
                        variant="dot"
                        invisible={!conversation.unread}
                        overlap="circular"
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                      >
                        <Avatar>{conversation.name[0]}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={conversation.name}
                      secondary={conversation.lastMessage}
                      primaryTypographyProps={{
                        fontWeight: conversation.unread ? 'bold' : 'regular',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {conversation.time}
                    </Typography>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Chat Window */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
            {/* Chat Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                {selectedConversation ? selectedConversation.name : 'Select a conversation'}
              </Typography>
            </Box>

            {/* Messages Area */}
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {selectedConversation ? (
                selectedConversation.messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.senderId === user?.id ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        backgroundColor:
                          message.senderId === user?.id ? 'primary.main' : 'grey.100',
                        color: message.senderId === user?.id ? 'white' : 'text.primary',
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textAlign: 'right',
                          mt: 0.5,
                          opacity: 0.8,
                        }}
                      >
                        {formatMessageTime(message.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" align="center">
                  Select a conversation to start messaging
                </Typography>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Box
              component="form"
              onSubmit={handleSendMessage}
              sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
            >
              <Grid container spacing={2}>
                <Grid item xs>
                  <TextField
                    fullWidth
                    placeholder="Type a message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    variant="outlined"
                    size="small"
                    disabled={!selectedConversation}
                  />
                </Grid>
                <Grid item>
                  <IconButton
                    color="primary"
                    type="submit"
                    disabled={!selectedConversation || !newMessage.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Messages;
