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
import { Document, Folder } from '../../types/document';
import documentService from '../../services/documentService';
import { formatDistanceToNow } from 'date-fns';

interface DocumentListProps {
  folderId?: string;
  onDocumentSelect?: (document: Document) => void;
  onFolderSelect?: (folder: Folder) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  folderId,
  onDocumentSelect,
  onFolderSelect,
}) => {
  const theme = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<Document | Folder | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [folderId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await documentService.getDocuments(folderId);
      
      // Separate documents and folders
      setDocuments(docs.filter(item => !item.folderId));
      // Transform documents into folders with required properties
      const folderItems = docs.filter(item => item.folderId).map(item => ({
        ...item,
        owner: item.uploadedBy,
        color: '#1976d2', // Default folder color
        icon: 'folder', // Default folder icon
      })) as Folder[];
      setFolders(folderItems);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

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
