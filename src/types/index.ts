export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes (e.g. 10 GB = 10 * 1024 * 1024 * 1024)
}

export interface FileItem {
  fileId: string;
  ownerId: string;
  fileName: string;
  originalName: string;
  storagePath: string;
  downloadURL: string;
  mimeType: string;
  fileSize: number;
  folderId?: string; // empty string or undefined for root
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  shared: boolean;
  shareId?: string;
  thumbnailURL?: string;
}

export interface Folder {
  folderId: string;
  ownerId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareItem {
  shareId: string;
  fileId: string;
  ownerId: string;
  fileName: string;
  originalName: string;
  downloadURL: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  enabled: boolean;
}

export interface UploadTaskItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'canceled';
  error?: string;
  cancelFn?: () => void;
}

export type ViewMode = 'grid' | 'list';

export type SortField = 'name' | 'date' | 'size' | 'type';
export type SortDirection = 'asc' | 'desc';

export type FileCategory = 'all' | 'images' | 'documents' | 'videos' | 'audio' | 'archives' | 'other';

export type ActiveNavTab =
  | 'dashboard'
  | 'files'
  | 'folders'
  | 'recent'
  | 'shared'
  | 'favorites'
  | 'trash'
  | 'storage'
  | 'settings'
  | 'profile';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export type SupportedLanguage =
  | 'en'
  | 'bn'
  | 'es'
  | 'fr'
  | 'de'
  | 'ar'
  | 'hi'
  | 'pt'
  | 'zh'
  | 'ja';

export type ThemeMode = 'light' | 'dark' | 'system';
