import React, { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import {
  Box,
  Button,
  Typography,
  Grid,
  Paper,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  CallEnd,
  ScreenShare,
  StopScreenShare,
  Chat as ChatIcon,
  FiberManualRecord,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../config/firebase';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteField,
  getDoc,
  addDoc,
} from 'firebase/firestore';
import recordingService, { IRecordingService } from './RecordingService';
import LiveStreamChat from './LiveStreamChat';

interface RoomData {
  createdBy: string;
  createdAt: any; // Firebase Timestamp
  participants: string[];
  consultantId: string;
  clientId?: string;
  status: 'waiting' | 'active' | 'inactive';
  sessionType: 'consultation';
  connections: {
    [key: string]: {
      joined: any; // Firebase Timestamp
      displayName: string;
      peerId: string;
      role: 'consultant' | 'client';
    };
  };
  endedAt?: any; // Firebase Timestamp
  lastActivity?: any; // Firebase Timestamp
}

interface LiveStreamRoomProps {
  roomId: string;
  onLeaveRoom: () => void;
  userRole: 'consultant' | 'client';
  clientId?: string; // Required when consultant creates room
}

const LiveStreamRoom: React.FC<LiveStreamRoomProps> = ({ roomId, onLeaveRoom, userRole, clientId }) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeCall, setActiveCall] = useState<MediaConnection | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [waitingForClient, setWaitingForClient] = useState(false);
  const MAX_RECONNECTION_ATTEMPTS = 3;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const recordingServiceRef = useRef<IRecordingService>(recordingService);

  useEffect(() => {
    initializeStream();
    return () => {
      cleanup();
    };
  }, [roomId]);

  useEffect(() => {
    const unsubscribe = listenToParticipants();
    return () => unsubscribe();
  }, [roomId]);

  const listenToParticipants = () => {
    const roomRef = doc(db, 'videoRooms', roomId);
    return onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.participants) {
        setParticipants(data.participants);
      }
    });
  };

  const initializeStream = async () => {
    try {
      setError(null);

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;

      // Display local stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize PeerJS
      peerRef.current = new Peer(user?.uid || '', {
        host: process.env.REACT_APP_PEER_HOST || 'localhost',
        port: Number(process.env.REACT_APP_PEER_PORT) || 9000,
        path: '/peerjs',
        secure: process.env.NODE_ENV === 'production',
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
              urls: process.env.REACT_APP_TURN_SERVER_URL || 'turn:your-turn-server.com:3478',
              username: process.env.REACT_APP_TURN_USERNAME || 'username',
              credential: process.env.REACT_APP_TURN_CREDENTIAL || 'credential'
            }
          ]
        }
      });

      setupPeerListeners();
      await joinRoom();

    } catch (err: any) {
      console.error('Error initializing stream:', err);
      handleError(err);
    }
  };

  const handleError = async (error: Error) => {
    setError(error.message);
    if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
      setReconnectionAttempts(prev => prev + 1);
      await cleanup();
      setTimeout(initializeStream, 2000); // Retry after 2 seconds
    }
  };

  const setupPeerListeners = () => {
    if (!peerRef.current) return;

    peerRef.current.on('open', (id) => {
      console.log('Connected with peer ID:', id);
    });

    peerRef.current.on('call', (call) => {
      if (localStreamRef.current) {
        call.answer(localStreamRef.current);
        setActiveCall(call);
        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
      }
    });

    peerRef.current.on('error', (err) => {
      console.error('PeerJS error:', err);
      handleError(err);
    });
  };

  const joinRoom = async () => {
    if (!user || !peerRef.current) return;

    const roomRef = doc(db, 'videoRooms', roomId);
    
    try {
      const roomSnapshot = await getDoc(roomRef);
      
      if (!roomSnapshot.exists()) {
        // Only consultants can create new rooms
        if (userRole !== 'consultant') {
          setError('Invalid room or session has ended.');
          return;
        }
        if (!clientId) {
          setError('Client ID is required to create a consultation.');
          return;
        }

        // Create room if consultant
        await setDoc(roomRef, {
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          participants: [user.uid],
          consultantId: user.uid,
          clientId: clientId,
          sessionType: 'consultation',
          status: 'waiting',
          connections: {
            [user.uid]: {
              joined: serverTimestamp(),
              displayName: user.displayName,
              peerId: peerRef.current.id,
              role: 'consultant'
            }
          }
        });
        setWaitingForClient(true);
      } else {
        // Check existing room
        const data = roomSnapshot.data() as RoomData;
        
        // Validate user's role and permissions
        if (userRole === 'consultant' && data.consultantId !== user.uid) {
          setError('You are not the assigned consultant for this session.');
          return;
        }
        if (userRole === 'client' && data.clientId !== user.uid) {
          setError('You are not the assigned client for this session.');
          return;
        }
        if (data.status === 'inactive') {
          setError('This session has ended.');
          return;
        }

        // Update room with user joining
        await updateDoc(roomRef, {
          status: 'active',
          participants: arrayUnion(user.uid),
          [`connections.${user.uid}`]: {
            joined: serverTimestamp(),
            displayName: user.displayName,
            peerId: peerRef.current.id,
            role: userRole
          },
          lastActivity: serverTimestamp()
        });
      }

      // Listen for room updates
      onSnapshot(roomRef, (snapshot) => {
        const data = snapshot.data() as RoomData;
        if (data) {
          setParticipants(data.participants);
          
          // Handle peer connections when both users are present
          if (data.participants.length === 2 && localStreamRef.current) {
            const otherParticipant = data.participants.find((p: string) => p !== user.uid);
            if (otherParticipant && userRole === 'consultant') {
              const newCall = peerRef.current?.call(otherParticipant, localStreamRef.current);
              if (newCall) {
                setActiveCall(newCall);
                newCall.on('stream', (remoteStream) => {
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                  }
                });
              }
            }
          }

          // Update waiting status
          setWaitingForClient(data.status === 'waiting' && userRole === 'consultant');
        }
      });

    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join the session. Please try again.');
    }
  };

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        const recordedBlob = await recordingServiceRef.current.stopRecording();
        const downloadUrl = await recordingServiceRef.current.uploadRecording(recordedBlob, roomId);
        
        // Save recording metadata to Firestore
        await addDoc(collection(db, 'videoRooms', roomId, 'recordings'), {
          url: downloadUrl,
          createdBy: user?.uid,
          createdAt: serverTimestamp(),
          duration: recordingServiceRef.current.getRecordingDuration()
        });
      } else {
        if (localStreamRef.current) {
          await recordingServiceRef.current.startRecording(localStreamRef.current);
        }
      }
      setIsRecording(!isRecording);
    } catch (err) {
      console.error('Error toggling recording:', err);
      setError('Failed to toggle recording');
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Switch back to camera
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          videoTrack.stop();
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newVideoTrack = newStream.getVideoTracks()[0];
          
          // Replace track in local video
          if (localVideoRef.current) {
            const stream = new MediaStream([newVideoTrack]);
            localVideoRef.current.srcObject = stream;
          }

          // Replace track in peer connection
          if (activeCall && peerRef.current) {
            // Close existing call
            activeCall.close();
            
            // Create a new call with updated stream
            const newStream = new MediaStream([
              newVideoTrack,
              ...localStreamRef.current.getAudioTracks()
            ]);
            localStreamRef.current = newStream;

            // Find other participant and make a new call
            const otherParticipant = participants.find(p => p !== user?.uid);
            if (otherParticipant) {
              const newCall = peerRef.current.call(otherParticipant, newStream);
              setActiveCall(newCall);
              newCall.on('stream', (remoteStream) => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = remoteStream;
                }
              });
            }
          }
        }
      } else {
        // Switch to screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        // Replace track in local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Replace track in peer connection
        if (activeCall && peerRef.current) {
          // Close existing call
          activeCall.close();
          
          // Create a new stream with screen share video and existing audio
          const newStream = new MediaStream([
            screenStream.getVideoTracks()[0],
            ...(localStreamRef.current?.getAudioTracks() || [])
          ]);
          localStreamRef.current = newStream;

          // Find other participant and make a new call
          const otherParticipant = participants.find(p => p !== user?.uid);
          if (otherParticipant) {
            const newCall = peerRef.current.call(otherParticipant, newStream);
            setActiveCall(newCall);
            newCall.on('stream', (remoteStream) => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
            });
          }
        }

        // Handle screen sharing stop
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      }

      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setError('Failed to toggle screen sharing');
    }
  };

  const cleanup = async () => {
    // Stop recording if active
    if (isRecording) {
      try {
        await recordingServiceRef.current.stopRecording();
      } catch (err) {
        console.error('Error stopping recording:', err);
      }
    }

    // Stop all tracks
    localStreamRef.current?.getTracks().forEach(track => track.stop());

    // Close peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Leave room
    if (user) {
      try {
        const roomRef = doc(db, 'videoRooms', roomId);
        const roomSnapshot = await getDoc(roomRef);
        
        if (roomSnapshot.exists()) {
          const data = roomSnapshot.data();
          if (data.participants.length <= 1) {
            // Last person leaving, mark room as inactive
            await updateDoc(roomRef, {
              status: 'inactive',
              endedAt: serverTimestamp(),
              participants: arrayRemove(user.uid),
              [`connections.${user.uid}`]: deleteField()
            });
          } else {
            // Others still in room
            await updateDoc(roomRef, {
              participants: arrayRemove(user.uid),
              [`connections.${user.uid}`]: deleteField(),
              lastActivity: serverTimestamp()
            });
          }
        }
      } catch (err) {
        console.error('Error cleaning up room:', err);
      }
    }
  };

  return (
    <Grid container spacing={2} sx={{ height: '100vh', p: 2 }}>
      <Grid item xs={12} md={isChatOpen ? 8 : 12}>
        <Box sx={{ position: 'relative', height: '100%' }}>
          {/* Video Grid */}
          <Grid container spacing={2} sx={{ height: 'calc(100% - 80px)' }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ height: '100%', position: 'relative' }}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    padding: '2px 8px',
                    borderRadius: 1,
                  }}
                >
                  You
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ height: '100%', position: 'relative' }}>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    padding: '2px 8px',
                    borderRadius: 1,
                  }}
                >
                  Remote User
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Controls */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              p: 2,
            }}
          >
            <IconButton
              onClick={() => {
                if (localStreamRef.current) {
                  const audioTrack = localStreamRef.current.getAudioTracks()[0];
                  audioTrack.enabled = !audioTrack.enabled;
                  setIsMicEnabled(!isMicEnabled);
                }
              }}
            >
              {isMicEnabled ? <Mic /> : <MicOff />}
            </IconButton>
            <IconButton
              onClick={() => {
                if (localStreamRef.current) {
                  const videoTrack = localStreamRef.current.getVideoTracks()[0];
                  videoTrack.enabled = !videoTrack.enabled;
                  setIsVideoEnabled(!isVideoEnabled);
                }
              }}
            >
              {isVideoEnabled ? <Videocam /> : <VideocamOff />}
            </IconButton>
            <IconButton
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
            </IconButton>
            <IconButton onClick={toggleRecording} color={isRecording ? 'error' : 'default'}>
              <FiberManualRecord />
            </IconButton>
            <IconButton onClick={() => setIsChatOpen(!isChatOpen)}>
              <ChatIcon />
            </IconButton>
            <IconButton onClick={onLeaveRoom} color="error">
              <CallEnd />
            </IconButton>
          </Box>

          {/* Error Display */}
          {error ? (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ position: 'absolute', top: 16, left: 16, right: 16 }}
            >
              {error}
            </Alert>
          ) : null}

          {/* Waiting for Client */}
          {waitingForClient ? (
            <Alert
              severity="info"
              sx={{ position: 'absolute', top: 16, left: 16, right: 16 }}
            >
              Waiting for client to join the session...
            </Alert>
          ) : null}
        </Box>
      </Grid>

      {/* Chat Panel */}
      {isChatOpen && (
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <LiveStreamChat roomId={roomId} />
        </Grid>
      )}
    </Grid>
  );
};

export default LiveStreamRoom;
