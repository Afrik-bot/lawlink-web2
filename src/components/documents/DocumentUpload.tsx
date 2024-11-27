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
  useTheme,
  alpha,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
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

  const updateUploadProgress = useCallback((progress: UploadProgress) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      newMap.set(progress.file.name, progress);
      return newMap;
    });
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Filter out files that exceed size limit
    const validFiles = acceptedFiles.filter(file => file.size <= maxFileSize);
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxFileSize);

    if (oversizedFiles.length > 0) {
      console.error(`${oversizedFiles.length} files exceed the size limit of ${maxFileSize / 1024 / 1024}MB`);
    }

    for (const file of validFiles) {
      try {
        // Initialize progress tracking
        updateUploadProgress({
          file,
          progress: 0,
          status: 'pending',
        });

        // Set up progress listener
        documentService.on('uploadProgress', (progress: UploadProgress) => {
          if (progress.file.name === file.name) {
            updateUploadProgress(progress);
          }
        });

        // Upload file
        const document = await documentService.uploadDocument(file, folderId);
        
        // Notify parent component
        onUploadComplete?.(document);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        updateUploadProgress({
          file,
          progress: 0,
          status: 'error',
          error: error.message,
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

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
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
                <ListItemText
                  primary={fileName}
                  secondary={
                    upload.error || `${Math.round(upload.progress)}% ${upload.status}`
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
              {upload.status === 'uploading' && (
                <LinearProgress
                  variant="determinate"
                  value={upload.progress}
                  sx={{ mt: 1 }}
                />
              )}
            </FileProgress>
          ))}
        </List>
      )}
    </Box>
  );
};

export default DocumentUpload;
