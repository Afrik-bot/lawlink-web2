export interface Document {
  _id: string;
  name: string;
  type: string;
  path: string;
  size: number;
  uploadedBy: string;
  consultantId: string;
  folderId?: string;
  tags: string[];
  sharedWith: {
    userId: string;
    accessLevel: 'read' | 'write';
  }[];
  status: 'pending' | 'approved' | 'rejected';
  description?: string;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  _id: string;
  name: string;
  path: string;
  parentId?: string;
  owner: string;
  consultantId: string;
  sharedWith: {
    userId: string;
    accessLevel: 'read' | 'write';
  }[];
  color: string;
  icon: string;
  documents?: Document[];
  subfolders?: Folder[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  document?: Document;
}
