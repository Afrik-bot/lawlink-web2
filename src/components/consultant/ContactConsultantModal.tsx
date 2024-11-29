import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ConsultantProfile } from '../../services/ConsultantService';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface ContactConsultantModalProps {
  open: boolean;
  onClose: () => void;
  consultant: ConsultantProfile;
}

interface MessageData {
  subject: string;
  message: string;
  caseType: string;
  urgency: 'low' | 'medium' | 'high';
}

const CASE_TYPES = [
  'General Inquiry',
  'New Case',
  'Existing Case',
  'Second Opinion',
  'Document Review',
  'Other',
];

const ContactConsultantModal: React.FC<ContactConsultantModalProps> = ({
  open,
  onClose,
  consultant,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<MessageData>({
    subject: '',
    message: '',
    caseType: '',
    urgency: 'medium',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to send a message');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create the message in Firestore
      await addDoc(collection(db, 'messages'), {
        from: currentUser.uid,
        to: consultant.userId,
        consultantId: consultant.id,
        subject: formData.subject,
        message: formData.message,
        caseType: formData.caseType,
        urgency: formData.urgency,
        status: 'unread',
        createdAt: serverTimestamp(),
      });

      // Create a conversation if it doesn't exist
      await addDoc(collection(db, 'conversations'), {
        participants: [currentUser.uid, consultant.userId],
        lastMessage: formData.message,
        lastMessageTime: serverTimestamp(),
        consultantId: consultant.id,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          subject: '',
          message: '',
          caseType: '',
          urgency: 'medium',
        });
      }, 2000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Contact {consultant.personalInfo.firstName} {consultant.personalInfo.lastName}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Message sent successfully!
            </Alert>
          )}

          {!currentUser && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please <Button color="inherit" onClick={() => {}}>sign in</Button> to contact the consultant
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Case Type</InputLabel>
              <Select
                name="caseType"
                value={formData.caseType}
                onChange={handleSelectChange}
                required
              >
                {CASE_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Urgency</InputLabel>
              <Select
                name="urgency"
                value={formData.urgency}
                onChange={handleSelectChange}
                required
              >
                <MenuItem value="low">Low - No immediate action required</MenuItem>
                <MenuItem value="medium">Medium - Response needed within 48 hours</MenuItem>
                <MenuItem value="high">High - Urgent response needed</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              multiline
              rows={4}
              helperText="Describe your legal matter briefly. Do not include sensitive information in this initial message."
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            Your message will be sent directly to {consultant.personalInfo.firstName}.
            They typically respond within 24-48 hours.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !currentUser}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Message'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ContactConsultantModal;
