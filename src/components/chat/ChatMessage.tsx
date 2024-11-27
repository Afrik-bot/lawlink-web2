import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Link,
  Chip,
  useTheme,
} from '@mui/material';
import {
  AttachFile as AttachmentIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ChatMessage as IChatMessage } from '../../services/chatService';

interface ChatMessageProps {
  message: IChatMessage;
  isCurrentUser: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          maxWidth: '70%',
          backgroundColor: isCurrentUser
            ? theme.palette.primary.main
            : theme.palette.grey[100],
          borderRadius: 2,
          position: 'relative',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: isCurrentUser ? 'white' : 'inherit',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </Typography>

        {message.attachments && message.attachments.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {message.attachments.map((attachment) => (
              <Link
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: isCurrentUser ? 'white' : 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <AttachmentIcon sx={{ mr: 0.5, fontSize: 16 }} />
                <Typography variant="body2">
                  {attachment.name}
                </Typography>
              </Link>
            ))}
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: '0.75rem' }}
        >
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </Typography>

        {isCurrentUser && message.read && (
          <Chip
            label="Read"
            size="small"
            variant="outlined"
            sx={{
              height: 16,
              fontSize: '0.65rem',
              '& .MuiChip-label': {
                px: 1,
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default ChatMessage;
