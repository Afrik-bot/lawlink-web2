import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Document } from '../../types/document';
import documentService from '../../services/documentService';

interface ShareDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  document: Document;
  onShare?: (document: Document) => void;
}

interface ShareRecipient {
  email: string;
  accessLevel: 'read' | 'write';
}

const ShareDocumentDialog: React.FC<ShareDocumentDialogProps> = ({
  open,
  onClose,
  document,
  onShare,
}) => {
  const [recipients, setRecipients] = useState<ShareRecipient[]>([]);
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<'read' | 'write'>('read');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddRecipient = () => {
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check for duplicates
    if (recipients.some(r => r.email === email)) {
      setError('This email has already been added');
      return;
    }

    setRecipients([...recipients, { email, accessLevel }]);
    setEmail('');
    setError(null);
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r.email !== email));
  };

  const handleShare = async () => {
    if (recipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Share with each recipient
      await Promise.all(
        recipients.map(recipient =>
          documentService.shareDocument(document._id, recipient.email, recipient.accessLevel)
        )
      );

      setSuccess('Document shared successfully');
      onShare?.(document);
      
      // Clear form after successful share
      setRecipients([]);
      setEmail('');
      setAccessLevel('read');
      
      // Close dialog after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to share document. Please try again.');
      console.error('Error sharing document:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Document</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {document.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Share this document with other users
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Access</InputLabel>
            <Select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as 'read' | 'write')}
              label="Access"
            >
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="write">Write</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleAddRecipient}
            disabled={!email}
          >
            Add
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          {recipients.map((recipient) => (
            <Chip
              key={recipient.email}
              label={`${recipient.email} (${recipient.accessLevel})`}
              onDelete={() => handleRemoveRecipient(recipient.email)}
              sx={{ m: 0.5 }}
            />
          ))}
        </Box>

        {document.sharedWith.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Currently shared with:
            </Typography>
            {document.sharedWith.map((share) => (
              <Chip
                key={share.userId}
                label={`${share.userId} (${share.accessLevel})`}
                size="small"
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleShare}
          variant="contained"
          disabled={loading || recipients.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : 'Share'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDocumentDialog;
