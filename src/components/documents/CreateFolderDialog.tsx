import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Folder } from '../../types/document';
import documentService from '../../services/documentService';

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  parentId?: string;
  onFolderCreated?: (folder: Folder) => void;
}

const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  open,
  onClose,
  parentId,
  onFolderCreated,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newFolder = await documentService.createFolder({
        name: name.trim(),
        parentId,
      });

      onFolderCreated?.(newFolder);
      onClose();
    } catch (err) {
      setError('Failed to create folder. Please try again.');
      console.error('Error creating folder:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Folder</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Enter a name for the new folder
          </Typography>
        </Box>

        <TextField
          label="Folder Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          error={!name.trim()}
          helperText={!name.trim() ? 'Name is required' : ''}
          disabled={loading}
          autoFocus
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !name.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFolderDialog;
