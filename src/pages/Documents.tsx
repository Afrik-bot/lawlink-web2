import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Add as AddIcon,
  Folder as FolderIcon,
  Description as DocumentIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  Timestamp,
  FieldValue,
  FieldPath,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';

interface DocumentBase {
  id: string;
  name: string;
  userId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'uploading' | 'completed' | 'error';
  sharedWith: Record<string, boolean>;
  type: string;
}

interface FileDocument extends DocumentBase {
  type: 'file';
  size: number;
  downloadURL?: string;
  storagePath?: string;
  errorMessage?: string;
}

interface FolderDocument extends DocumentBase {
  type: 'folder';
  children: string[];
}

type LawDocument = FileDocument | FolderDocument;

// Interface for document data when creating/updating in Firestore
interface FirestoreDocumentData {
  id: string;
  name: string;
  userId: string;
  ownerId: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
  status: 'uploading' | 'completed' | 'error';
  sharedWith: Record<string, boolean>;
  type: 'file' | 'folder';
  size?: number;
  downloadURL?: string;
  storagePath?: string;
  errorMessage?: string;
  children?: string[];
}

const Documents = () => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedDoc, setSelectedDoc] = React.useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [folders, setFolders] = useState<LawDocument[]>([]);
  const [documents, setDocuments] = useState<LawDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to parse dates from various formats
  const parseDate = (field: any): Date | null => {
    if (!field) return null;
    if (field.toDate && typeof field.toDate === 'function') {
      return field.toDate();
    }
    if (field instanceof Date) {
      return field;
    }
    if (typeof field === 'string') {
      const parsed = new Date(field);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  useEffect(() => {
    if (!user?.uid) {
      console.log('No user found, skipping document fetch');
      setLoading(false);
      return;
    }

    console.log('Triggering document fetch for user:', {
      uid: user.uid,
      email: user.email
    });
    fetchDocuments();
  }, [user?.uid]); // Only re-run when user.uid changes

  const fetchDocuments = async () => {
    if (!user?.uid) {
      console.log('No user found:', user);
      setError('Please sign in to view documents');
      setLoading(false);
      return;
    }

    console.log('Starting document fetch for user:', {
      uid: user.uid,
      email: user.email
    });
    setLoading(true);
    setError(null);

    try {
      const docsRef = collection(db, 'documents');
      
      // Query for both owned and shared documents
      const [ownedSnapshot, sharedSnapshot] = await Promise.all([
        // Get owned documents
        getDocs(query(docsRef, where('userId', '==', user.uid))),
        // Get shared documents
        getDocs(query(docsRef, where(`sharedWith.${user.uid}`, '==', true)))
      ]);

      console.log('Documents fetched successfully:', {
        owned: {
          empty: ownedSnapshot.empty,
          size: ownedSnapshot.size
        },
        shared: {
          empty: sharedSnapshot.empty,
          size: sharedSnapshot.size
        }
      });

      // Combine and process documents
      const processSnapshot = (snapshot: any) => {
        return snapshot.docs.map((doc: any) => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: parseDate(data.createdAt) || new Date(),
            updatedAt: parseDate(data.updatedAt) || new Date()
          } as LawDocument;
        });
      };

      const allDocs = [
        ...processSnapshot(ownedSnapshot),
        ...processSnapshot(sharedSnapshot)
      ];

      // Sort by creation date (newest first)
      const sortedDocs = allDocs.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      setFolders(sortedDocs.filter(doc => doc.type === 'folder'));
      setDocuments(sortedDocs.filter(doc => doc.type === 'file'));
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Failed to fetch documents');
      setLoading(false);
    }
  };

  const handleDelete = async (document: LawDocument) => {
    try {
      if (!user || document.ownerId !== user.uid) {
        setError('You do not have permission to delete this document');
        return;
      }

      if (document.type !== 'folder' && document.storagePath) {
        try {
          const storageRef = ref(storage, document.storagePath);
          await deleteObject(storageRef);
        } catch (storageErr: any) {
          console.error('Error deleting from storage:', storageErr);
        }
      }

      await deleteDoc(doc(db, 'documents', document.id));

      setSuccess('Document deleted successfully');
      setTimeout(() => setSuccess(null), 3000);

      await fetchDocuments();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setError(`Failed to delete document: ${err.message}`);
    }
  };

  const handleShare = async (document: LawDocument) => {
    try {
      if (!shareEmail.trim()) {
        setError('Please enter an email address');
        return;
      }

      if (!user || document.ownerId !== user.uid) {
        setError('You do not have permission to share this document');
        return;
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', shareEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('User not found with this email address');
        return;
      }

      const targetUser = querySnapshot.docs[0];
      const targetUserId = targetUser.id;

      const docRef = doc(db, 'documents', document.id);
      await updateDoc(docRef, {
        [`sharedWith.${targetUserId}`]: true,
        updatedAt: serverTimestamp()
      });

      setShareEmail('');
      setShareDialogOpen(false);
      setSuccess('Document shared successfully');
      setTimeout(() => setSuccess(null), 3000);

      await fetchDocuments();
    } catch (err: any) {
      console.error('Error sharing document:', err);
      setError(`Failed to share document: ${err.message}`);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, docId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedDoc(docId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDoc(null);
  };

  const handleDownload = async (document: LawDocument) => {
    try {
      if (document.type !== 'file') {
        setError('Cannot download a folder');
        return;
      }

      if (!document.downloadURL) {
        setError('Download URL not available');
        return;
      }

      window.open(document.downloadURL, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document');
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    let documentId: string | null = null;

    if (!file) {
      setError('No file selected');
      return;
    }

    try {
      if (!user) {
        setError('You must be logged in to upload documents');
        return;
      }

      documentId = doc(collection(db, 'documents')).id;

      const documentData: FirestoreDocumentData = {
        id: documentId,
        name: file.name,
        type: 'file',
        size: file.size,
        userId: user.uid,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'uploading',
        sharedWith: {}
      };

      await setDoc(doc(db, 'documents', documentId), documentData);

      const storageRef = ref(storage, `documents/${user.uid}/${documentId}/${file.name}`);
      const metadata = {
        contentType: file.type,
        customMetadata: {
          ownerId: user.uid,
          documentId: documentId,
          fileName: file.name
        }
      };

      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await updateDoc(doc(db, 'documents', documentId), {
        downloadURL,
        storagePath: storageRef.fullPath,
        status: 'completed'
      });

      setSuccess('Document uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);

      await fetchDocuments();
    } catch (err: any) {
      console.error('Error uploading document:', err);
      if (documentId) {
        try {
          await updateDoc(doc(db, 'documents', documentId), {
            status: 'error',
            errorMessage: err.message
          });
        } catch (updateErr) {
          console.error('Failed to update document status:', updateErr);
        }
      }
      setError(`Failed to upload document: ${err.message}`);
    }
  };

  const handleCreateFolder = async () => {
    try {
      if (!user) {
        setError('You must be logged in to create folders');
        return;
      }

      if (!newFolderName.trim()) {
        setError('Please enter a folder name');
        return;
      }

      const folderRef = doc(collection(db, 'documents'));
      const folderData: FirestoreDocumentData = {
        id: folderRef.id,
        name: newFolderName.trim(),
        type: 'folder',
        userId: user.uid,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'completed',
        sharedWith: {},
        children: []
      };

      await setDoc(folderRef, folderData);

      setNewFolderName('');
      setNewFolderDialogOpen(false);
      setSuccess('Folder created successfully');
      setTimeout(() => setSuccess(null), 3000);

      await fetchDocuments();
    } catch (err: any) {
      console.error('Error creating folder:', err);
      setError(`Failed to create folder: ${err.message}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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

      <Grid container spacing={3}>
        {/* Folders Section */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Folders
              </Typography>
              <IconButton onClick={() => setNewFolderDialogOpen(true)}>
                <AddIcon />
              </IconButton>
            </Box>
            {loading ? (
              <Typography>Loading folders...</Typography>
            ) : folders.length === 0 ? (
              <Typography color="text.secondary">No folders</Typography>
            ) : (
              <List dense>
                {folders.map((folder) => (
                  <ListItem
                    key={folder.id}
                    secondaryAction={
                      <IconButton edge="end" onClick={(e) => handleMenuOpen(e, folder.id)}>
                        <MoreVertIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <FolderIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={folder.name}
                      secondary={
                        <>
                          {folder.createdAt instanceof Date ? folder.createdAt.toLocaleDateString() : 'Date not available'}
                          {folder.ownerId !== user?.uid && ' • Shared with you'}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Documents Section */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Documents
              </Typography>
              <input
                type="file"
                id="upload-file"
                style={{ display: 'none' }}
                onChange={handleUpload}
                accept=".pdf,.doc,.docx,.txt"
              />
              <label htmlFor="upload-file">
                <Button
                  component="span"
                  variant="contained"
                  startIcon={<UploadIcon />}
                >
                  Upload
                </Button>
              </label>
            </Box>
            {loading ? (
              <Typography>Loading documents...</Typography>
            ) : documents.length === 0 ? (
              <Typography color="text.secondary">No documents uploaded yet</Typography>
            ) : (
              <List>
                {documents.map((doc) => (
                  <ListItem
                    key={doc.id}
                    secondaryAction={
                      <IconButton edge="end" onClick={(e) => handleMenuOpen(e, doc.id)}>
                        <MoreVertIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <DocumentIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={
                        <>
                          {doc.createdAt instanceof Date ? doc.createdAt.toLocaleDateString() : 'Date not available'}
                          {doc.type === 'file' && (
                            <>
                              {' • '}
                              {(doc.size / 1024).toFixed(1)} KB
                            </>
                          )}
                          {doc.ownerId !== user?.uid && ' • Shared with you'}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Document Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedDoc && (() => {
          const doc = [...documents, ...folders].find(d => d.id === selectedDoc);
          if (!doc) return null;

          return (
            <>
              {doc.type === 'file' && (
                <MenuItem onClick={() => {
                  handleDownload(doc);
                  handleMenuClose();
                }}>
                  <ListItemIcon>
                    <DownloadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Download</ListItemText>
                </MenuItem>
              )}
              {doc.ownerId === user?.uid && (
                <>
                  <MenuItem onClick={() => {
                    setShareDialogOpen(true);
                    handleMenuClose();
                  }}>
                    <ListItemIcon>
                      <ShareIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Share</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => {
                    if (window.confirm('Are you sure you want to delete this ' + (doc.type === 'folder' ? 'folder' : 'document') + '?')) {
                      handleDelete(doc);
                    }
                    handleMenuClose();
                  }}>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                  </MenuItem>
                </>
              )}
            </>
          );
        })()}
      </Menu>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the email address of the user you want to share this document with.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            const doc = documents.find(d => d.id === selectedDoc);
            if (doc) handleShare(doc);
          }}>Share</Button>
        </DialogActions>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onClose={() => setNewFolderDialogOpen(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder}>Create</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Documents;
