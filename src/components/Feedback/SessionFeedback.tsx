import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Rating,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import feedbackService, { SessionFeedback as SessionFeedbackType } from '../../services/FeedbackService';

interface SessionFeedbackProps {
  sessionId: string;
  onFeedbackSubmitted?: () => void;
}

export const SessionFeedback: React.FC<SessionFeedbackProps> = ({
  sessionId,
  onFeedbackSubmitted,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [communication, setCommunication] = useState<number | null>(null);
  const [expertise, setExpertise] = useState<number | null>(null);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [comments, setComments] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [existingFeedback, setExistingFeedback] = useState<SessionFeedbackType | null>(null);

  useEffect(() => {
    const checkExistingFeedback = async () => {
      if (!user) return;
      try {
        const feedbackId = `${sessionId}_${user.uid}`;
        const feedback = await feedbackService.getFeedback(feedbackId);
        if (feedback) {
          setExistingFeedback(feedback);
          setRating(feedback.rating);
          setCommunication(feedback.communication);
          setExpertise(feedback.expertise);
          setSatisfaction(feedback.satisfaction);
          setComments(feedback.comments);
          setWouldRecommend(feedback.wouldRecommend);
        }
      } catch (error) {
        console.error('Error checking existing feedback:', error);
      }
    };

    checkExistingFeedback();
  }, [sessionId, user]);

  const handleSubmit = async () => {
    if (!user || !rating || !communication || !expertise || !satisfaction) return;

    setLoading(true);
    try {
      await feedbackService.submitFeedback({
        sessionId,
        userId: user.uid,
        role: user.role as 'client' | 'consultant',
        rating,
        communication,
        expertise,
        satisfaction,
        comments,
        wouldRecommend,
      });

      setOpen(false);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    if (!existingFeedback) {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        disabled={!!existingFeedback}
      >
        {existingFeedback ? 'Feedback Submitted' : 'Submit Feedback'}
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Session Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography component="legend">Overall Rating</Typography>
            <Rating
              value={rating}
              onChange={(_, value) => setRating(value)}
              size="large"
            />
          </Box>

          <Box sx={{ my: 2 }}>
            <Typography component="legend">Communication</Typography>
            <Rating
              value={communication}
              onChange={(_, value) => setCommunication(value)}
            />
          </Box>

          <Box sx={{ my: 2 }}>
            <Typography component="legend">Expertise</Typography>
            <Rating
              value={expertise}
              onChange={(_, value) => setExpertise(value)}
            />
          </Box>

          <Box sx={{ my: 2 }}>
            <Typography component="legend">Satisfaction</Typography>
            <Rating
              value={satisfaction}
              onChange={(_, value) => setSatisfaction(value)}
            />
          </Box>

          <Box sx={{ my: 2 }}>
            <TextField
              label="Comments"
              multiline
              rows={4}
              fullWidth
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </Box>

          <Box sx={{ my: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={wouldRecommend}
                  onChange={(e) => setWouldRecommend(e.target.checked)}
                  color="primary"
                />
              }
              label="Would you recommend this consultant?"
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            disabled={loading || !rating || !communication || !expertise || !satisfaction}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionFeedback;
