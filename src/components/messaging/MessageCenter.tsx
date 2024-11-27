import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Divider,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  Send,
  AttachFile,
  InsertEmoticon,
  MoreVert
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import { Message, MessageThread, MessageDraft } from '../../types/message';

interface MessageCenterProps {
  userId: string;
  consultantId: string;
}

const MessageCenter: React.FC<MessageCenterProps> = ({ userId, consultantId }) => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread._id);
    }
  }, [selectedThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadThreads = async () => {
    try {
      const response = await axios.get('/api/messages/threads');
      setThreads(response.data);
    } catch (error) {
      console.error('Failed to load message threads:', error);
    }
  };

  const loadMessages = async (threadId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/messages/thread/${threadId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedThread) return;

    const draft: MessageDraft = {
      recipient: selectedThread.participants.find(p => p !== userId) || '',
      content: messageInput,
      attachments: []
    };

    try {
      const response = await axios.post('/api/messages', draft);
      setMessages(prev => [...prev, response.data]);
      setMessageInput('');
      loadThreads(); // Refresh threads to update last message
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatMessageTime = (date: Date) => {
    return format(new Date(date), 'p');
  };

  return (
    <Box sx={{ height: '600px', display: 'flex' }}>
      <Paper sx={{ width: 320, borderRight: 1, borderColor: 'divider' }}>
        <List sx={{ height: '100%', overflow: 'auto' }}>
          {threads.map(thread => (
            <ListItem
              key={thread._id}
              button
              selected={selectedThread?._id === thread._id}
              onClick={() => setSelectedThread(thread)}
            >
              <ListItemAvatar>
                <Avatar>
                  {thread.participants[0].charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={thread.participants.find(p => p !== userId)}
                secondary={
                  thread.lastMessage
                    ? thread.lastMessage.content.substring(0, 30) +
                      (thread.lastMessage.content.length > 30 ? '...' : '')
                    : 'No messages'
                }
              />
              {thread.unreadCount > 0 && (
                <Badge badgeContent={thread.unreadCount} color="primary" />
              )}
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedThread ? (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                {selectedThread.participants.find(p => p !== userId)}
              </Typography>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                messages.map((message, index) => (
                  <Box
                    key={message._id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.sender === userId ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        backgroundColor: message.sender === userId ? 'primary.main' : 'grey.100',
                        color: message.sender === userId ? 'white' : 'text.primary',
                        borderRadius: 2,
                        p: 2
                      }}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          textAlign: 'right',
                          mt: 1,
                          opacity: 0.7
                        }}
                      >
                        {formatMessageTime(message.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>

            <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <IconButton size="small">
                    <AttachFile />
                  </IconButton>
                </Grid>
                <Grid item>
                  <IconButton size="small">
                    <InsertEmoticon />
                  </IconButton>
                </Grid>
                <Grid item xs>
                  <TextField
                    fullWidth
                    placeholder="Type a message"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    multiline
                    maxRows={4}
                  />
                </Grid>
                <Grid item>
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <Send />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a conversation to start messaging
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessageCenter;
