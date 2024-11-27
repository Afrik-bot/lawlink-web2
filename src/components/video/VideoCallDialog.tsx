import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import VideoChat from './VideoChat';

interface VideoCallDialogProps {
  open: boolean;
  onClose: () => void;
  roomName: string;
  token: string;
  participantName?: string;
}

const VideoCallDialog: React.FC<VideoCallDialogProps> = ({
  open,
  onClose,
  roomName,
  token,
  participantName,
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinCall = async () => {
    setIsJoining(true);
    // In a real app, you might want to do some preparation here
    // such as checking permissions
    setTimeout(() => {
      setIsJoining(false);
      setIsCallActive(true);
    }, 1000);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        Video Call
        {participantName && (
          <Typography variant="subtitle1" color="text.secondary">
            with {participantName}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent
        sx={{
          p: isCallActive ? 1 : 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isCallActive ? 'stretch' : 'center',
        }}
      >
        {isCallActive ? (
          <VideoChat
            roomName={roomName}
            token={token}
            onEndCall={handleEndCall}
          />
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Ready to join the video call?
            </Typography>
            {participantName && (
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {participantName} is waiting for you to join.
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleJoinCall}
              disabled={isJoining}
              sx={{ mt: 2 }}
            >
              {isJoining ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Joining...
                </>
              ) : (
                'Join Call'
              )}
            </Button>
          </Box>
        )}
      </DialogContent>

      {!isCallActive && (
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default VideoCallDialog;
