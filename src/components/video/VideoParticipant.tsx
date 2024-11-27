import React, { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideoIcon,
  VideocamOff as VideoOffIcon,
} from '@mui/icons-material';
import { VideoParticipant as IVideoParticipant } from '../../services/videoService';

interface VideoParticipantProps {
  participant: IVideoParticipant;
  large?: boolean;
}

const VideoParticipant: React.FC<VideoParticipantProps> = ({
  participant,
  large = false,
}) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (participant.videoTrack && videoRef.current) {
      const videoElement = videoRef.current;
      participant.videoTrack.attach(videoElement);
      return () => {
        participant.videoTrack?.detach(videoElement);
      };
    }
  }, [participant.videoTrack]);

  useEffect(() => {
    if (participant.audioTrack && audioRef.current) {
      const audioElement = audioRef.current;
      participant.audioTrack.attach(audioElement);
      return () => {
        participant.audioTrack?.detach(audioElement);
      };
    }
  }, [participant.audioTrack]);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'relative',
        width: large ? '100%' : 300,
        height: large ? '100%' : 225,
        backgroundColor: theme.palette.grey[900],
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: participant.isLocal ? 'scaleX(-1)' : undefined,
        }}
      />
      <audio ref={audioRef} autoPlay />

      {/* Participant info overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 1,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            color: 'white',
            textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {participant.identity}
          {participant.isLocal && ' (You)'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            sx={{
              color: 'white',
              backgroundColor: participant.audioTrack ? 'transparent' : 'error.main',
              '&:hover': {
                backgroundColor: participant.audioTrack ? 'rgba(255,255,255,0.1)' : 'error.dark',
              },
            }}
          >
            {participant.audioTrack ? <MicIcon /> : <MicOffIcon />}
          </IconButton>

          <IconButton
            size="small"
            sx={{
              color: 'white',
              backgroundColor: participant.videoTrack ? 'transparent' : 'error.main',
              '&:hover': {
                backgroundColor: participant.videoTrack ? 'rgba(255,255,255,0.1)' : 'error.dark',
              },
            }}
          >
            {participant.videoTrack ? <VideoIcon /> : <VideoOffIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* No video placeholder */}
      {!participant.videoTrack && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.grey[900],
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: 'white',
              textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
              textTransform: 'uppercase',
            }}
          >
            {participant.identity[0]}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default VideoParticipant;
