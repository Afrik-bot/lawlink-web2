import { Document, Folder, UploadProgress } from '../types/document';
import { API_BASE_URL } from '../config';
import { authService } from './authService';
import { EventEmitter } from 'events';

class DocumentService extends EventEmitter {
  private baseUrl = `${API_BASE_URL}/api/documents`;
  private readonly CHUNK_SIZE = 1024 * 1024 * 2; // 2MB chunks
  private activeUploads: Map<string, { abort: () => void }> = new Map();

  constructor() {
    super();
  }

  private async getHeaders(): Promise<Headers> {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    return new Headers({
      'Authorization': `Bearer ${token}`,
    });
  }

  async uploadDocument(
    file: File,
    folderId?: string,
    metadata: Partial<Document> = {}
  ): Promise<Document> {
    const uploadId = crypto.randomUUID();
    let uploadedChunks = 0;
    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);

    const abortController = new AbortController();
    this.activeUploads.set(uploadId, { abort: () => abortController.abort() });

    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to upload documents');
      }

      // Initialize upload
      const headers = await this.getHeaders();
      const initResponse = await fetch(`${this.baseUrl}/upload/init`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          fileType: file.type,
          folderId,
          metadata: {
            ...metadata,
            userId: user.uid,
            ownerId: user.uid,
          },
        }),
        signal: abortController.signal,
      });

      if (!initResponse.ok) {
        throw new Error('Failed to initialize upload');
      }

      const { uploadId: serverUploadId } = await initResponse.json();

      // Upload chunks
      const chunks: Blob[] = [];
      for (let start = 0; start < file.size; start += this.CHUNK_SIZE) {
        chunks.push(file.slice(start, start + this.CHUNK_SIZE));
      }

      const uploadChunk = async (chunk: Blob, index: number) => {
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', index.toString());
        formData.append('uploadId', serverUploadId);
        formData.append('userId', user.uid);

        try {
          const response = await fetch(`${this.baseUrl}/upload/chunk`, {
            method: 'POST',
            headers: await this.getHeaders(),
            body: formData,
            signal: abortController.signal,
          });

          if (!response.ok) {
            throw new Error(`Failed to upload chunk ${index}`);
          }

          uploadedChunks++;
          const progress = (uploadedChunks / totalChunks) * 100;

          this.emit('uploadProgress', {
            uploadId,
            file,
            progress,
            status: 'uploading',
          } as UploadProgress);
        } catch (error: unknown) {
          this.emit('uploadProgress', {
            uploadId,
            file,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : `Failed to upload chunk ${index}`,
          } as UploadProgress);
          throw error instanceof Error ? error : new Error(`Failed to upload chunk ${index}`);
        }
      };

      // Upload chunks in parallel, but limit concurrency
      const concurrency = 3;
      for (let i = 0; i < chunks.length; i += concurrency) {
        const batch = chunks.slice(i, i + concurrency);
        await Promise.all(batch.map((chunk, index) => uploadChunk(chunk, i + index)));
      }

      // Complete upload
      const completeResponse = await fetch(`${this.baseUrl}/upload/complete`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId: serverUploadId,
          userId: user.uid,
          metadata: {
            ...metadata,
            userId: user.uid,
            ownerId: user.uid,
          },
        }),
        signal: abortController.signal,
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload');
      }

      const document = await completeResponse.json();
      
      this.emit('uploadProgress', {
        uploadId,
        file,
        progress: 100,
        status: 'completed',
        document,
      } as UploadProgress);

      this.activeUploads.delete(uploadId);
      return document;
    } catch (error: unknown) {
      this.emit('uploadProgress', {
        uploadId,
        file,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      } as UploadProgress);

      this.activeUploads.delete(uploadId);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred during upload');
    }
  }

  cancelUpload(uploadId: string): void {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      upload.abort();
      this.activeUploads.delete(uploadId);
    }
  }

  async getDocuments(folderId?: string): Promise<Document[]> {
    try {
      const headers = await this.getHeaders();
      const url = new URL(this.baseUrl);
      if (folderId) url.searchParams.append('folderId', folderId);

      const response = await fetch(url.toString(), {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      return response.json();
    } catch (error: unknown) {
      throw error instanceof Error ? error : new Error('Failed to fetch documents');
    }
  }

  async createFolder(folder: Partial<Folder>): Promise<Folder> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to create folders');
      }

      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/folders`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...folder,
          userId: user.uid,
          ownerId: user.uid,
          type: 'folder',
          status: 'active',
          sharedWith: {},
          metadata: {
            createdAt: new Date(),
            lastModified: new Date()
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create folder');
      }

      const newFolder = await response.json();
      console.log('Folder created successfully:', newFolder);
      
      // Emit folderCreated event
      this.emit('folderCreated', newFolder);
      
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error instanceof Error ? error : new Error('Failed to create folder');
    }
  }

  async shareDocument(documentId: string, userId: string, accessLevel: 'read' | 'write'): Promise<Document> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/${documentId}/share`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, accessLevel }),
      });

      if (!response.ok) {
        throw new Error('Failed to share document');
      }

      return response.json();
    } catch (error: unknown) {
      throw error instanceof Error ? error : new Error('Failed to share document');
    }
  }

  async updateDocument(documentId: string, updates: Partial<Document>): Promise<Document> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/${documentId}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update document');
      }

      return response.json();
    } catch (error: unknown) {
      throw error instanceof Error ? error : new Error('Failed to update document');
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/${documentId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
    } catch (error: unknown) {
      throw error instanceof Error ? error : new Error('Failed to delete document');
    }
  }

  async moveDocument(documentId: string, targetFolderId: string): Promise<Document> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/${documentId}/move`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetFolderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to move document');
      }

      return response.json();
    } catch (error: unknown) {
      throw error instanceof Error ? error : new Error('Failed to move document');
    }
  }
}

export const documentService = new DocumentService();
export default documentService;
