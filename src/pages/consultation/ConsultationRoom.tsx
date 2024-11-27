import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import VideoChat from '../../components/video/VideoChat';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../../hooks/useAuth';
import websocketService from '../../services/websocketService';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
}));

const MessageInput = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    borderRadius: theme.shape.borderRadius,
  },
}));

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

interface ConsultationRoomProps {
  consultationId: string;
  remoteUserId: string;
}

const ConsultationRoom: React.FC<ConsultationRoomProps> = ({
  consultationId,
  remoteUserId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Connect to WebSocket when component mounts
    websocketService.connect();

    // Set up WebSocket event listeners
    websocketService.on('chat-message', (message: Message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });

    websocketService.on('file-shared', (fileInfo) => {
      // Handle received file info
      console.log('File received:', fileInfo);
    });

    websocketService.on('consultation-ended', () => {
      // Handle consultation end
      handleEndCall();
    });

    return () => {
      // Clean up WebSocket connection when component unmounts
      websocketService.disconnect();
    };
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        sender: user?.id || '',
        content: newMessage,
        timestamp: new Date(),
      };
      
      // Send message through WebSocket
      websocketService.send('chat-message', {
        consultationId,
        message,
      });

      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('consultationId', consultationId);

      try {
        // Upload file to server
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/consultations/upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const fileInfo = await response.json();
          
          // Notify other participant through WebSocket
          websocketService.send('file-shared', {
            consultationId,
            fileInfo,
          });
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const handleEndCall = () => {
    // Notify other participant through WebSocket
    websocketService.send('consultation-ended', {
      consultationId,
    });
    
    // Clean up and redirect
    websocketService.disconnect();
    // Add navigation logic here
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const chatSection = (
    <StyledPaper elevation={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Chat</Typography>
        {isMobile && (
          <IconButton onClick={toggleDrawer}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <ChatContainer>
        <List>
          {messages.map((message) => (
            <React.Fragment key={message.id}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={message.sender === user?.id ? 'You' : 'Remote User'}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {message.content}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </>
                  }
                  sx={{
                    textAlign: message.sender === user?.id ? 'right' : 'left',
                  }}
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      </ChatContainer>
      <Box display="flex" gap={1}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <IconButton
          color="primary"
          onClick={() => fileInputRef.current?.click()}
        >
          <AttachFileIcon />
        </IconButton>
        <MessageInput
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          endIcon={<SendIcon />}
        >
          Send
        </Button>
      </Box>
    </StyledPaper>
  );

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', p: 2 }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12} md={9} sx={{ height: '100%' }}>
          <VideoChat
            remoteUserId={remoteUserId}
            onEndCall={handleEndCall}
          />
        </Grid>
        {isMobile ? (
          <>
            <Box
              position="fixed"
              bottom={16}
              right={16}
              zIndex={1}
            >
              <IconButton
                color="primary"
                onClick={toggleDrawer}
                sx={{ backgroundColor: 'background.paper' }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
            <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={toggleDrawer}
              sx={{
                '& .MuiDrawer-paper': {
                  width: '80%',
                  maxWidth: 400,
                },
              }}
            >
              {chatSection}
            </Drawer>
          </>
        ) : (
          <Grid item md={3} sx={{ height: '100%' }}>
            {chatSection}
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ConsultationRoom;
