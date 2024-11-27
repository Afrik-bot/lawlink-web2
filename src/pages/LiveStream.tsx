import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { VideoCall as VideoCallIcon } from '@mui/icons-material';
import LiveStreamRoom from '../components/LiveStream/LiveStreamRoom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const LiveStream: React.FC = () => {
  const { user } = useAuth();
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    try {
      const newRoomId = uuidv4();
      const roomRef = doc(db, 'videoRooms', newRoomId);
      
      await setDoc(roomRef, {
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        participants: [user?.uid],
        status: 'active',
      });

      setActiveRoom(newRoomId);
    } catch (err: any) {
      console.error('Error creating room:', err);
      setError(err.message || 'Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    try {
      setActiveRoom(roomId);
      setIsJoinDialogOpen(false);
      setRoomId('');
    } catch (err: any) {
      console.error('Error joining room:', err);
      setError(err.message || 'Failed to join room');
    }
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
  };

  if (activeRoom) {
    return <LiveStreamRoom roomId={activeRoom} onLeaveRoom={handleLeaveRoom} />;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <VideoCallIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Live Video Consultation
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Start or join a video consultation session with your legal consultant.
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleCreateRoom}
          >
            Start New Session
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => setIsJoinDialogOpen(true)}
          >
            Join Session
          </Button>
        </Box>
      </Paper>

      {/* Join Room Dialog */}
      <Dialog open={isJoinDialogOpen} onClose={() => setIsJoinDialogOpen(false)}>
        <DialogTitle>Join Video Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Session ID"
            fullWidth
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsJoinDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleJoinRoom} variant="contained">
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LiveStream;
