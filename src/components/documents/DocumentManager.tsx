import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Breadcrumbs,
  Link,
  Menu,
  Grid,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  CreateNewFolder as CreateNewFolderIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios, { AxiosError } from 'axios';
import { Document, Folder as FolderType, UploadProgress } from '../../types/document';

interface DocumentManagerProps {
  consultantId: string;
  currentFolderId?: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ consultantId, currentFolderId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedItem, setSelectedItem] = useState<Document | FolderType | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));

    setUploads(prev => [...prev, ...newUploads]);

    for (const upload of newUploads) {
      const formData = new FormData();
      formData.append('file', upload.file);
      formData.append('consultantId', consultantId);
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      try {
        const response = await axios.post('/api/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploads(prev =>
              prev.map(u =>
                u.file === upload.file ? { ...u, progress } : u
              )
            );
          }
        });

        setUploads(prev =>
          prev.map(u =>
            u.file === upload.file ? { ...u, status: 'completed' as const } : u
          )
        );

        setDocuments(prev => [...prev, response.data]);
      } catch (error: unknown) {
        console.error('Upload failed:', error);
        const axiosError = error as AxiosError<{ message: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Upload failed';
        setUploads(prev =>
          prev.map(u =>
            u.file === upload.file
              ? { ...u, status: 'error' as const, error: errorMessage }
              : u
          )
        );
      }
    }
  }, [consultantId, currentFolderId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const handleCreateFolder = async () => {
    try {
      const response = await axios.post('/api/folders', {
        name: newFolderName,
        consultantId,
        parentId: currentFolderId
      });
      setFolders(prev => [...prev, response.data]);
      setNewFolderDialogOpen(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleItemMenu = (event: React.MouseEvent<HTMLElement>, item: Document | FolderType) => {
    event.stopPropagation();
    setSelectedItem(item);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      if ('type' in selectedItem) {
        await axios.delete(`/api/documents/${selectedItem._id}`);
        setDocuments(prev => prev.filter(d => d._id !== selectedItem._id));
      } else {
        await axios.delete(`/api/folders/${selectedItem._id}`);
        setFolders(prev => prev.filter(f => f._id !== selectedItem._id));
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
    handleMenuClose();
  };

  const handleFolderClick = (folderId: string) => {
    console.log(`Folder clicked: ${folderId}`);
  };

  const handleDocumentClick = (document: Document) => {
    console.log(`Document clicked: ${document._id}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>Document Manager</Typography>
        <Box {...getRootProps()} sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer'
        }}>
          <input {...getInputProps()} />
          <UploadFileIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
          <Typography>
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag and drop files here, or click to select files'}
          </Typography>
        </Box>
      </Box>

      {uploads.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Uploads</Typography>
          <List>
            {uploads.map((upload, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {upload.status === 'completed' ? (
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  ) : upload.status === 'error' ? (
                    <ErrorIcon sx={{ color: 'error.main' }} />
                  ) : (
                    <CircularProgress size={24} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={upload.file.name}
                  secondary={
                    upload.status === 'error'
                      ? upload.error
                      : `${Math.round(upload.progress)}% ${upload.status}`
                  }
                />
                {upload.status === 'error' && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setUploads(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Breadcrumbs>
              <Link href="#" onClick={() => {}}>
                Documents
              </Link>
              {/* Add dynamic breadcrumbs based on folder hierarchy */}
            </Breadcrumbs>
          </Grid>
          <Grid item>
            <Button
              startIcon={<CreateNewFolderIcon />}
              onClick={() => setNewFolderDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              New Folder
            </Button>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              {...getRootProps()}
            >
              Upload Files
              <input {...getInputProps()} />
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <List>
          {folders.map(folder => (
            <ListItem
              key={folder._id}
              onClick={() => handleFolderClick(folder._id)}
              secondaryAction={
                <IconButton edge="end" onClick={(e) => handleItemMenu(e, folder)}>
                  <MoreVertIcon />
                </IconButton>
              }
            >
              <ListItemIcon>
                <FolderIcon sx={{ color: folder.color }} />
              </ListItemIcon>
              <ListItemText
                primary={folder.name}
                secondary={`${folder.documents?.length || 0} files`}
              />
            </ListItem>
          ))}

          {documents.map(document => (
            <ListItem
              key={document._id}
              component="button"
              onClick={() => handleDocumentClick(document)}
              secondaryAction={
                <IconButton edge="end" onClick={(e) => handleItemMenu(e, document)}>
                  <MoreVertIcon />
                </IconButton>
              }
            >
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText
                primary={document.name}
                secondary={`${(document.size / 1024).toFixed(2)} KB`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={newFolderDialogOpen} onClose={() => setNewFolderDialogOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DocumentManager;
