import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Rating,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  consultationType: string;
  verified: boolean;
  helpful: number;
  response?: {
    comment: string;
    createdAt: Date;
  };
}

interface ReviewsSectionProps {
  consultantId: string;
  onRatingUpdate: (newRating: number, newReviewCount: number) => void;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ consultantId, onRatingUpdate }) => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
    consultationType: '',
  });
  const [ratingStats, setRatingStats] = useState({
    average: 0,
    total: 0,
    distribution: [0, 0, 0, 0, 0],
  });

  useEffect(() => {
    loadReviews();
  }, [consultantId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const reviewsRef = collection(db, 'reviews');
      const q = query(
        reviewsRef,
        where('consultantId', '==', consultantId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        response: doc.data().response ? {
          ...doc.data().response,
          createdAt: doc.data().response.createdAt.toDate(),
        } : undefined,
      })) as Review[];

      setReviews(reviewsData);

      // Calculate rating statistics
      const total = reviewsData.length;
      const sum = reviewsData.reduce((acc, review) => acc + review.rating, 0);
      const distribution = [0, 0, 0, 0, 0];
      reviewsData.forEach(review => {
        distribution[review.rating - 1]++;
      });

      const stats = {
        average: total > 0 ? sum / total : 0,
        total,
        distribution,
      };

      setRatingStats(stats);
      onRatingUpdate(stats.average, stats.total);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Check if user has already reviewed
      const existingReviewQuery = query(
        collection(db, 'reviews'),
        where('consultantId', '==', consultantId),
        where('userId', '==', currentUser.uid)
      );
      const existingReviews = await getDocs(existingReviewQuery);
      
      if (!existingReviews.empty) {
        setError('You have already reviewed this consultant');
        return;
      }

      // Add new review
      await addDoc(collection(db, 'reviews'), {
        consultantId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        rating: newReview.rating,
        comment: newReview.comment,
        consultationType: newReview.consultationType,
        createdAt: serverTimestamp(),
        verified: true,
        helpful: 0,
      });

      // Refresh reviews
      await loadReviews();
      setAddReviewOpen(false);
      setNewReview({ rating: 0, comment: '', consultationType: '' });
    } catch (err) {
      console.error('Error adding review:', err);
      setError('Failed to add review');
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!currentUser) return;

    try {
      // Update helpful count in Firestore
      // You would need to implement this logic
    } catch (err) {
      console.error('Error marking review as helpful:', err);
    }
  };

  const renderRatingDistribution = () => (
    <Box sx={{ mb: 3 }}>
      {[5, 4, 3, 2, 1].map((rating) => (
        <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ mr: 1, minWidth: '20px' }}>
            {rating}
          </Typography>
          <Box sx={{ flexGrow: 1, mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={ratingStats.total > 0 ? (ratingStats.distribution[rating - 1] / ratingStats.total) * 100 : 0}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="body2" sx={{ minWidth: '30px' }}>
            {ratingStats.distribution[rating - 1]}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Client Reviews</Typography>
        <Button
          variant="contained"
          onClick={() => setAddReviewOpen(true)}
          disabled={!currentUser}
        >
          Write a Review
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3">{ratingStats.average.toFixed(1)}</Typography>
          <Rating value={ratingStats.average} readOnly precision={0.5} />
          <Typography variant="body2" color="text.secondary">
            {ratingStats.total} reviews
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          {renderRatingDistribution()}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {reviews.map((review) => (
        <Box key={review.id} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Avatar src={`https://api.dicebear.com/7.x/initials/svg?seed=${review.userName}`} />
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle1">{review.userName}</Typography>
                {review.verified && (
                  <Chip label="Verified Client" size="small" color="success" variant="outlined" />
                )}
              </Box>
              <Rating value={review.rating} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">
                {format(review.createdAt, 'MMM d, yyyy')}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Consultation Type: {review.consultationType}
          </Typography>

          <Typography paragraph>{review.comment}</Typography>

          {review.response && (
            <Box sx={{ ml: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Consultant's Response
              </Typography>
              <Typography variant="body2">
                {review.response.comment}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(review.response.createdAt, 'MMM d, yyyy')}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Button
              size="small"
              onClick={() => handleHelpful(review.id)}
              disabled={!currentUser}
            >
              Helpful ({review.helpful})
            </Button>
          </Box>

          <Divider sx={{ mt: 2 }} />
        </Box>
      ))}

      {/* Add Review Dialog */}
      <Dialog open={addReviewOpen} onClose={() => setAddReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Write a Review</DialogTitle>
        <DialogContent>
          {!currentUser && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please sign in to write a review
            </Alert>
          )}

          <Box sx={{ my: 2 }}>
            <Typography component="legend">Rating</Typography>
            <Rating
              value={newReview.rating}
              onChange={(_, value) => setNewReview(prev => ({ ...prev, rating: value || 0 }))}
              size="large"
            />
          </Box>

          <TextField
            select
            fullWidth
            label="Consultation Type"
            value={newReview.consultationType}
            onChange={(e) => setNewReview(prev => ({ ...prev, consultationType: e.target.value }))}
            sx={{ mb: 2 }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="">Select type</option>
            {Object.values(LEGAL_SPECIALTIES).map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Your Review"
            multiline
            rows={4}
            value={newReview.comment}
            onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddReviewOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddReview}
            variant="contained"
            disabled={!currentUser || !newReview.rating || !newReview.comment || !newReview.consultationType}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ReviewsSection;
