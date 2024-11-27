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
  Autocomplete,
  Chip,
} from '@mui/material';
import { Document } from '../../types/document';
import documentService from '../../services/documentService';

interface EditDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  document: Document;
  onEdit?: (document: Document) => void;
}

interface DocumentEditData {
  name: string;
  description: string;
  tags: string[];
}

const EditDocumentDialog: React.FC<EditDocumentDialogProps> = ({
  open,
  onClose,
  document,
  onEdit,
}) => {
  const [formData, setFormData] = useState<DocumentEditData>({
    name: document.name,
    description: document.description || '',
    tags: document.tags,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: keyof DocumentEditData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleTagsChange = (_event: React.SyntheticEvent, newTags: string[]) => {
    setFormData({
      ...formData,
      tags: newTags,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Document name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedDocument = await documentService.updateDocument(document._id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags: formData.tags,
      });

      setSuccess('Document updated successfully');
      onEdit?.(updatedDocument);
      
      // Close dialog after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to update document. Please try again.');
      console.error('Error updating document:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Document</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Update document information
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name"
            value={formData.name}
            onChange={handleInputChange('name')}
            fullWidth
            required
            error={!formData.name.trim()}
            helperText={!formData.name.trim() ? 'Name is required' : ''}
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={handleInputChange('description')}
            fullWidth
            multiline
            rows={3}
          />

          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={formData.tags}
            onChange={handleTagsChange}
            renderTags={(value: string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Add tags"
                helperText="Press enter to add a tag"
              />
            )}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDocumentDialog;
