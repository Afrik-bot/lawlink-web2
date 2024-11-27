import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Close } from '@mui/icons-material';
import StreamView from './StreamView';

interface StreamingModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  isHost: boolean;
  title: string;
}

const StreamingModal: React.FC<StreamingModalProps> = ({
  open,
  onClose,
  sessionId,
  isHost,
  title
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: fullScreen ? '100%' : '90vh',
          maxHeight: '90vh',
          bgcolor: theme.palette.background.default
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <StreamView sessionId={sessionId} isHost={isHost} />
      </DialogContent>
    </Dialog>
  );
};

export default StreamingModal;
