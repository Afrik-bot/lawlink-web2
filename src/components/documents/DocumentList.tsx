import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Folder as FolderIcon,
  MoreVert as MoreIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Document, Folder, UploadProgress } from '../../types/document';
import documentService from '../../services/documentService';
import { formatDistanceToNow } from 'date-fns';

interface DocumentListProps {
  folderId?: string;
  onDocumentSelect?: (document: Document) => void;
  onFolderSelect?: (folder: Folder) => void;
  onUploadComplete?: () => void;
  onFolderCreated?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  folderId,
  onDocumentSelect,
  onFolderSelect,
  onUploadComplete,
  onFolderCreated,
}) => {
  const theme = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<Document | Folder | null>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching documents for folder:', folderId);
      const docs = await documentService.getDocuments(folderId);
      console.log('Fetched documents:', docs);
      
      // Separate documents and folders
      const documentItems = docs.filter(item => item.type !== 'folder');
      const folderItems = docs.filter(item => item.type === 'folder').map(item => ({
        _id: item._id,
        name: item.name,
        path: item.path,
        parentId: item.folderId,
        owner: item.uploadedBy,
        consultantId: item.consultantId,
        sharedWith: item.sharedWith,
        color: '#1976d2', // Default folder color
        icon: 'folder', // Default folder icon
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })) as Folder[];
      
      console.log('Documents:', documentItems);
      console.log('Folders:', folderItems);
      
      setDocuments(documentItems);
      setFolders(folderItems);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Load documents on mount and when folderId changes
  useEffect(() => {
    loadDocuments();
  }, [folderId]);

  // Reload documents when a new document is uploaded
  useEffect(() => {
    const handleUploadProgress = (progress: UploadProgress) => {
      if (progress.status === 'completed') {
        console.log('Upload completed, reloading documents');
        loadDocuments();
      }
    };

    documentService.on('uploadProgress', handleUploadProgress);
    return () => {
      documentService.off('uploadProgress', handleUploadProgress);
    };
  }, []);

  // Reload documents when a new folder is created
  useEffect(() => {
    const handleFolderCreated = () => {
      console.log('Folder created, reloading documents');
      loadDocuments();
    };

    documentService.on('folderCreated', handleFolderCreated);
    return () => {
      documentService.off('folderCreated', handleFolderCreated);
    };
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: Document | Folder) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedItem(null);
  };

  const handleShare = async () => {
    if (!selectedItem) return;
    // Implement share functionality
    handleMenuClose();
  };

  const handleEdit = () => {
    if (!selectedItem) return;
    // Implement edit functionality
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await documentService.deleteDocument(selectedItem._id);
      loadDocuments(); // Reload the list
    } catch (err) {
      console.error('Error deleting document:', err);
    }
    handleMenuClose();
  };

  const handleDownload = async () => {
    if (!selectedItem || 'folderId' in selectedItem) return;
    // Implement download functionality
    handleMenuClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <List>
        {folders.map((folder) => (
          <ListItem
            key={folder._id}
            button
            onClick={() => onFolderSelect?.(folder)}
            sx={{
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            <ListItemIcon>
              <FolderIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={folder.name}
              secondary={`${folder.documents?.length || 0} items`}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={(e) => handleMenuOpen(e, folder)}
                size="small"
              >
                <MoreIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}

        {documents.map((document) => (
          <ListItem
            key={document._id}
            button
            onClick={() => onDocumentSelect?.(document)}
            sx={{
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            <ListItemIcon>
              <DocumentIcon />
            </ListItemIcon>
            <ListItemText
              primary={document.name}
              secondary={
                <Box component="span" sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" component="span">
                    {formatFileSize(document.size)}
                  </Typography>
                  <Typography variant="caption" component="span">
                    •
                  </Typography>
                  <Typography variant="caption" component="span">
                    {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                  </Typography>
                  {document.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ height: 20 }}
                    />
                  ))}
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={(e) => handleMenuOpen(e, document)}
                size="small"
              >
                <MoreIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleShare}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {selectedItem && !('folderId' in selectedItem) && (
          <MenuItem onClick={handleDownload}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        )}
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

export default DocumentList;
