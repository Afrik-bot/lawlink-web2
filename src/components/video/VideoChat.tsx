import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, Paper, Typography, CircularProgress, Alert, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';
import { videoService, VideoParticipant as IVideoParticipant } from '../../services/videoService';
import VideoParticipant from './VideoParticipant';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const ControlButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  borderRadius: '50%',
  minWidth: '48px',
  width: '48px',
  height: '48px',
  padding: 0,
}));

interface VideoChatProps {
  roomName: string;
  token: string;
  onEndCall?: () => void;
}

const VideoChat: React.FC<VideoChatProps> = ({ roomName, token, onEndCall }) => {
  const [participants, setParticipants] = useState<IVideoParticipant[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeVideo = async () => {
      try {
        setIsLoading(true);
        await videoService.initialize(
          (participant) => {
            setParticipants(prev => [...prev, participant]);
          },
          (participant) => {
            setParticipants(prev => prev.filter(p => p.identity !== participant.identity));
          },
          (error) => {
            setError(error.message);
          }
        );

        await videoService.joinRoom(roomName, token);
        setIsLoading(false);
      } catch (error: any) {
        setError(error.message || 'Failed to start video');
        setIsLoading(false);
      }
    };

    initializeVideo();

    return () => {
      videoService.leaveRoom();
    };
  }, [roomName, token]);

  const toggleVideo = async () => {
    await videoService.toggleVideo(!isVideoEnabled);
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = async () => {
    await videoService.toggleAudio(!isAudioEnabled);
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleEndCall = async () => {
    await videoService.leaveRoom();
    onEndCall?.();
  };

  const handleFlipCamera = async () => {
    await videoService.switchCamera();
  };

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const localParticipant = participants.find(p => p.isLocal);
  const remoteParticipants = participants.filter(p => !p.isLocal);

  return (
    <StyledPaper>
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        {/* Main video area */}
        <Grid item xs={12} md={9}>
          {remoteParticipants.length > 0 ? (
            <VideoParticipant participant={remoteParticipants[0]} large />
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
                Waiting for others to join...
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Side panel with local video */}
        <Grid item xs={12} md={3}>
          {localParticipant && (
            <VideoParticipant participant={localParticipant} />
          )}
        </Grid>
      </Grid>

      {/* Control buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 2,
        }}
      >
        <Tooltip title={isAudioEnabled ? 'Mute' : 'Unmute'}>
          <ControlButton
            onClick={toggleAudio}
            color={isAudioEnabled ? 'primary' : 'error'}
            variant="contained"
          >
            {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
          </ControlButton>
        </Tooltip>

        <Tooltip title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}>
          <ControlButton
            onClick={toggleVideo}
            color={isVideoEnabled ? 'primary' : 'error'}
            variant="contained"
          >
            {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
          </ControlButton>
        </Tooltip>

        <Tooltip title="Flip camera">
          <ControlButton
            onClick={handleFlipCamera}
            color="primary"
            variant="contained"
          >
            <FlipCameraIosIcon />
          </ControlButton>
        </Tooltip>

        <Tooltip title="End call">
          <ControlButton
            onClick={handleEndCall}
            color="error"
            variant="contained"
          >
            <CallEndIcon />
          </ControlButton>
        </Tooltip>
      </Box>
    </StyledPaper>
  );
};

export default VideoChat;
