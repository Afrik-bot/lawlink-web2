import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
  Typography,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachmentIcon,
} from '@mui/icons-material';
import { chatService, ChatMessage, Conversation } from '../../services/chatService';
import ChatMessageComponent from './ChatMessage';

interface ChatWindowProps {
  conversation: Conversation;
  onMessageSent?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onMessageSent,
}) => {
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
  }, [conversation._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getMessages(conversation._id);
      setMessages(data);

      // Mark unread messages as read
      const unreadMessages = data
        .filter(msg => !msg.read && msg.senderId !== localStorage.getItem('userId'))
        .map(msg => msg._id);
      
      if (unreadMessages.length > 0) {
        await chatService.markAsRead(unreadMessages);
      }
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!messageInput.trim()) return;

    try {
      setSending(true);
      const receiverId = conversation.participants.find(
        id => id !== localStorage.getItem('userId')
      );
      
      if (!receiverId) throw new Error('Receiver not found');

      await chatService.sendMessage(receiverId, messageInput.trim());
      setMessageInput('');
      onMessageSent?.();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      setSending(true);
      const receiverId = conversation.participants.find(
        id => id !== localStorage.getItem('userId')
      );
      
      if (!receiverId) throw new Error('Receiver not found');

      await chatService.sendMessage(receiverId, '', Array.from(files));
      onMessageSent?.();
    } catch (err) {
      console.error('Error sending attachments:', err);
    } finally {
      setSending(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const currentUserId = localStorage.getItem('userId');

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.map((message) => (
          <ChatMessageComponent
            key={message._id}
            message={message}
            isCurrentUser={message.senderId === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <IconButton
            onClick={handleAttachmentClick}
            disabled={sending}
            size="small"
          >
            <AttachmentIcon />
          </IconButton>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSend}
                    disabled={sending || !messageInput.trim()}
                    color="primary"
                  >
                    {sending ? (
                      <CircularProgress size={24} />
                    ) : (
                      <SendIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatWindow;
