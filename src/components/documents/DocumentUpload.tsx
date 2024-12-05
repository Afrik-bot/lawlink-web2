import React, { useCallback, useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  useTheme,
  alpha,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useDropzone } from 'react-dropzone';
import { Document, UploadProgress } from '../../types/document';
import documentService from '../../services/documentService';

interface DocumentUploadProps {
  folderId?: string;
  onUploadComplete?: (document: Document) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

const UploadZone = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderColor: theme.palette.primary.main,
  },
}));

const FileProgress = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
}));

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  folderId,
  onUploadComplete,
  maxFiles = 10,
  acceptedFileTypes = ['application/pdf', 'image/*', '.doc', '.docx'],
  maxFileSize = 50 * 1024 * 1024, // 50MB
}) => {
  const theme = useTheme();
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const uploadsRef = useRef<Map<string, UploadProgress>>(uploads);
  uploadsRef.current = uploads;

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const updateUploadProgress = useCallback((progress: UploadProgress) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      newMap.set(progress.file.name, progress);
      return newMap;
    });
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!folderId) {
      showSnackbar('No folder selected for upload', 'error');
      return;
    }

    // Filter out files that exceed size limit
    const validFiles = acceptedFiles.filter(file => file.size <= maxFileSize);
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxFileSize);

    if (oversizedFiles.length > 0) {
      showSnackbar(`${oversizedFiles.length} files exceed the size limit of ${maxFileSize / 1024 / 1024}MB`, 'error');
    }

    for (const file of validFiles) {
      try {
        // Initialize progress tracking
        updateUploadProgress({
          file,
          progress: 0,
          status: 'pending',
        });

        showSnackbar(`Starting upload: ${file.name}`, 'info');

        // Set up progress listener
        const handleProgress = (progress: UploadProgress) => {
          if (progress.file.name === file.name) {
            updateUploadProgress(progress);
            if (progress.status === 'completed') {
              showSnackbar(`Successfully uploaded: ${file.name}`, 'success');
              // Only call onUploadComplete if we have both the callback and the document
              if (onUploadComplete && progress.document) {
                onUploadComplete(progress.document);
              }
            } else if (progress.status === 'error') {
              const errorMessage = progress.error || 'Unknown error';
              if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
                showSnackbar(`Permission denied: You don't have access to upload to this folder`, 'error');
              } else {
                showSnackbar(`Failed to upload: ${file.name} - ${errorMessage}`, 'error');
              }
            }
          }
        };

        documentService.on('uploadProgress', handleProgress);

        // Upload file
        const document = await documentService.uploadDocument(file, folderId);
        
        // Clean up progress listener
        documentService.off('uploadProgress', handleProgress);

        // Notify parent component with the document from the upload response
        if (onUploadComplete && document) {
          onUploadComplete(document);
        }
      } catch (error: unknown) {
        console.error(`Error uploading ${file.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
          showSnackbar(`Permission denied: You don't have access to upload to this folder`, 'error');
        } else {
          showSnackbar(`Error uploading ${file.name}: ${errorMessage}`, 'error');
        }
        updateUploadProgress({
          file,
          progress: 0,
          status: 'error',
          error: errorMessage,
        });
      }
    }
  }, [folderId, maxFileSize, onUploadComplete, updateUploadProgress]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, curr) => ({ ...acc, [curr]: [] }), {}),
    maxFiles,
    maxSize: maxFileSize,
  });

  const cancelUpload = (fileName: string) => {
    const upload = uploadsRef.current.get(fileName);
    if (upload && upload.status === 'uploading') {
      documentService.cancelUpload(fileName);
      updateUploadProgress({
        ...upload,
        status: 'error',
        error: 'Upload cancelled',
      });
    }
  };

  const removeUpload = (fileName: string) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileName);
      return newMap;
    });
  };

  return (
    <Box>
      <UploadZone
        {...getRootProps()}
        sx={{
          borderColor: isDragActive ? 'primary.main' : 'divider',
          backgroundColor: isDragActive
            ? alpha(theme.palette.primary.main, 0.05)
            : 'background.default',
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          or click to select files
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          Accepted files: {acceptedFileTypes.join(', ')}
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block">
          Maximum file size: {maxFileSize / 1024 / 1024}MB
        </Typography>
      </UploadZone>

      {uploads.size > 0 && (
        <List>
          {Array.from(uploads.entries()).map(([fileName, upload]) => (
            <FileProgress key={fileName} elevation={1}>
              <ListItem>
                <ListItemIcon>
                  {upload.status === 'completed' ? (
                    <CheckCircleIcon color="success" />
                  ) : upload.status === 'error' ? (
                    <ErrorIcon color="error" />
                  ) : (
                    <CircularProgress
                      variant="determinate"
                      value={upload.progress}
                      size={24}
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={fileName}
                  secondary={
                    upload.error || 
                    (upload.status === 'completed' 
                      ? 'Upload complete'
                      : `${Math.round(upload.progress)}% - ${upload.status}`)
                  }
                  secondaryTypographyProps={{
                    color: upload.error ? 'error' : 'textSecondary',
                  }}
                />
                <ListItemSecondaryAction>
                  {upload.status === 'uploading' ? (
                    <IconButton
                      edge="end"
                      onClick={() => cancelUpload(fileName)}
                      size="small"
                    >
                      <CloseIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      edge="end"
                      onClick={() => removeUpload(fileName)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            </FileProgress>
          ))}
        </List>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentUpload;
