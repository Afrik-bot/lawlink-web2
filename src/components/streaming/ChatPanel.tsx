import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Send, Close } from '@mui/icons-material';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';

interface ChatMessage {
  id: string;
  from: string;
  message: string;
  timestamp: Date;
}

interface ChatPanelProps {
  sessionId: string;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId, onClose }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('stream-message', (data: {
      from: string;
      message: string;
      timestamp: string;
    }) => {
      const message: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        from: data.from,
        message: data.message,
        timestamp: new Date(data.timestamp)
      };
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('stream-message');
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !newMessage.trim() || !user) return;

    const message = {
      sessionId,
      message: newMessage.trim(),
      from: user.id
    };

    socket.emit('stream-message', message);
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      from: user.id,
      message: newMessage.trim(),
      timestamp: new Date()
    }]);
    setNewMessage('');
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Chat</Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>
      <Divider />
      
      <List
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {messages.map((msg) => (
          <ListItem
            key={msg.id}
            sx={{
              flexDirection: 'column',
              alignItems: msg.from === user?.id ? 'flex-end' : 'flex-start',
              p: 0
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1,
                bgcolor: msg.from === user?.id ? 'primary.main' : 'grey.100',
                color: msg.from === user?.id ? 'white' : 'text.primary',
                maxWidth: '80%',
                borderRadius: 2
              }}
            >
              <ListItemText
                primary={msg.message}
                secondary={new Date(msg.timestamp).toLocaleTimeString()}
                secondaryTypographyProps={{
                  color: msg.from === user?.id ? 'inherit' : undefined,
                  sx: { opacity: 0.7 }
                }}
              />
            </Paper>
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </List>

      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          variant="outlined"
        />
        <IconButton
          color="primary"
          type="submit"
          disabled={!newMessage.trim()}
        >
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatPanel;
