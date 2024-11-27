import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Editor } from '@tinymce/tinymce-react';
import websocketService from '../../services/websocketService';
import { debounce } from 'lodash';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const EditorContainer = styled(Box)({
  flexGrow: 1,
  '& .tox-tinymce': {
    border: 'none',
    height: '100% !important',
  },
});

const Toolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingBottom: theme.spacing(1),
}));

interface SharedEditorProps {
  documentId: string;
  consultationId: string;
  initialContent?: string;
  onSave?: (content: string) => void;
}

interface DocumentChange {
  userId: string;
  timestamp: Date;
  content: string;
}

const SharedEditor: React.FC<SharedEditorProps> = ({
  documentId,
  consultationId,
  initialContent = '',
  onSave,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [changes, setChanges] = useState<DocumentChange[]>([]);
  const editorRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Initialize editor with collaborative features
  useEffect(() => {
    websocketService.on('document-change', (data: { content: string }) => {
      if (editorRef.current && isEditorReady) {
        editorRef.current.setContent(data.content);
      }
    });

    return () => {
      websocketService.off('document-change', () => {});
    };
  }, [isEditorReady]);

  // Handle content changes with debounce
  const handleEditorChange = debounce((content: string) => {
    setContent(content);
    websocketService.send('document-change', {
      documentId,
      consultationId,
      content,
    });
  }, 500);

  // Save document
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/documents/${documentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      setLastSaved(new Date());
      onSave?.(content);
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Track document changes
  const handleTrackChange = () => {
    const newChange: DocumentChange = {
      userId: 'current-user-id', // Replace with actual user ID
      timestamp: new Date(),
      content,
    };
    setChanges([...changes, newChange]);
  };

  // Copy document content
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <StyledPaper elevation={3}>
      <Toolbar>
        <Typography variant="h6">Shared Document Editor</Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Copy content">
            <IconButton onClick={handleCopy}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="View history">
            <IconButton onClick={handleTrackChange}>
              <HistoryIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={isSaving ? 'Saving...' : 'Save document'}>
            <IconButton
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <CircularProgress size={24} /> : <SaveIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      
      <EditorContainer>
        <Editor
          onInit={(evt, editor) => {
            editorRef.current = editor;
            setIsEditorReady(true);
          }}
          initialValue={initialContent}
          init={{
            height: '100%',
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help',
            content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px }',
          }}
          onEditorChange={handleEditorChange}
        />
      </EditorContainer>

      {lastSaved && (
        <Typography variant="caption" color="text.secondary" mt={1}>
          Last saved: {lastSaved.toLocaleString()}
        </Typography>
      )}
    </StyledPaper>
  );
};

export default SharedEditor;
