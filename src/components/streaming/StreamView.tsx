import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Grid, Paper, Typography, IconButton } from '@mui/material';
import { Mic, MicOff, Videocam, VideocamOff, ScreenShare, StopScreenShare, Chat } from '@mui/icons-material';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import ChatPanel from './ChatPanel';
import { StreamSocket, RTCSignalData, StreamSignalData } from '../../types/socket';

interface StreamViewProps {
  sessionId: string;
  isHost: boolean;
}

interface RemoteStream {
  stream: MediaStream;
  userId?: string;
}

interface ParticipantJoinedData {
  socketId: string;
  userId: string;
}

interface SignalMessage {
  from: string;
  signal: RTCSignalData;
}

const StreamView: React.FC<StreamViewProps> = ({ sessionId, isHost }) => {
  const { user } = useAuth();
  const socket = useSocket() as StreamSocket;
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    if (!socket || !user) return;

    const initializeStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initializeStream();

    socket.emit('join-stream', { sessionId, userId: user.id });

    socket.on('participant-joined', async ({ socketId }: ParticipantJoinedData) => {
      if (localStream) {
        try {
          const pc = createPeerConnection(socketId);
          if (pc && localStream) {
            localStream.getTracks().forEach(track => {
              pc.addTrack(track, localStream);
            });
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('signal', {
              to: socketId,
              signal: {
                type: 'offer',
                offer
              }
            } as StreamSignalData);
          }
        } catch (error) {
          console.error('Error handling participant joined:', error);
        }
      }
    });

    socket.on('signal', async ({ from, signal }: SignalMessage) => {
      let pc = peerConnections.current.get(from);
      
      if (!pc) {
        pc = createPeerConnection(from);
      }

      try {
        if (signal.type === 'offer' && 'offer' in signal && signal.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', {
            to: from,
            signal: {
              type: 'answer',
              answer
            }
          } as StreamSignalData);
        } else if (signal.type === 'answer' && 'answer' in signal && signal.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
        } else if (signal.type === 'candidate' && 'candidate' in signal && signal.candidate) {
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    });

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peerConnections.current.forEach(pc => pc.close());
      socket.off('participant-joined');
      socket.off('signal');
    };
  }, [socket, user, sessionId, localStream]);

  const createPeerConnection = (peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStreams(prev => {
          const newStreams = new Map(prev);
          newStreams.set(peerId, { stream: event.streams[0] });
          return newStreams;
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        try {
          socket.emit('signal', {
            to: peerId,
            signal: {
              type: 'candidate',
              candidate: event.candidate
            }
          } as StreamSignalData);
        } catch (error) {
          console.error('Error sending ICE candidate:', error);
        }
      }
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            setIsScreenSharing(false);
          };

          peerConnections.current.forEach(pc => {
            if (pc) {
              const sender = pc.getSenders().find(s => s.track?.kind === 'video');
              if (sender) {
                sender.replaceTrack(videoTrack);
              }
            }
          });

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          setIsScreenSharing(true);
        }
      } else {
        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            peerConnections.current.forEach(pc => {
              if (pc) {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                  sender.replaceTrack(videoTrack);
                }
              }
            });

            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
            }
          }
          setIsScreenSharing(false);
        }
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      setIsScreenSharing(false);
    }
  };

  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={isChatOpen ? 9 : 12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 1, position: 'relative' }}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', borderRadius: '4px' }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    px: 1,
                    borderRadius: 1
                  }}
                >
                  You {isHost ? '(Host)' : ''}
                </Typography>
              </Paper>
            </Grid>
            {Array.from(remoteStreams).map(([peerId, { stream }]) => (
              <Grid item xs={12} md={6} key={peerId}>
                <Paper elevation={3} sx={{ p: 1, position: 'relative' }}>
                  <video
                    ref={el => {
                      if (el) {
                        remoteVideoRefs.current.set(peerId, el);
                        el.srcObject = stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    style={{ width: '100%', borderRadius: '4px' }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      color: 'white',
                      bgcolor: 'rgba(0,0,0,0.5)',
                      px: 1,
                      borderRadius: 1
                    }}
                  >
                    Participant
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
        {isChatOpen && (
          <Grid item xs={3}>
            <ChatPanel
              sessionId={sessionId}
              onClose={() => setIsChatOpen(false)}
            />
          </Grid>
        )}
      </Grid>

      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
          p: 1,
          display: 'flex',
          gap: 1
        }}
      >
        <IconButton onClick={toggleAudio} color={isMuted ? 'error' : 'primary'}>
          {isMuted ? <MicOff /> : <Mic />}
        </IconButton>
        <IconButton onClick={toggleVideo} color={isVideoOff ? 'error' : 'primary'}>
          {isVideoOff ? <VideocamOff /> : <Videocam />}
        </IconButton>
        <IconButton onClick={toggleScreenShare} color={isScreenSharing ? 'error' : 'primary'}>
          {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
        </IconButton>
        <IconButton onClick={() => setIsChatOpen(!isChatOpen)} color={isChatOpen ? 'primary' : 'default'}>
          <Chat />
        </IconButton>
        {isHost && socket && (
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => socket.emit('end-stream', { sessionId })}
          >
            End Stream
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default StreamView;
