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
  Alert,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import CloseIcon from '@mui/icons-material/Close';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
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
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Creating folder:', name.trim());
      const newFolder = await documentService.createFolder({
        name: name.trim(),
        parentId,
      });
      console.log('Folder created successfully:', newFolder);

      setSuccess(true);
      if (onFolderCreated) {
        onFolderCreated(newFolder);
      }
      
      // Close dialog after a brief delay to show success state
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err: unknown) {
      console.error('Error creating folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create folder. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
          Create New Folder
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Enter a name for the new folder
          </Typography>
        </Box>

        <TextField
          label="Folder Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null); // Clear error when user types
          }}
          fullWidth
          required
          error={!!error}
          helperText={error || ' '}
          disabled={loading || success}
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FolderIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Folder created successfully!
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          startIcon={<CloseIcon />}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || loading || success}
          variant="contained"
          startIcon={loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <CreateNewFolderIcon />
          )}
        >
          {success ? 'Created!' : 'Create Folder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFolderDialog;
