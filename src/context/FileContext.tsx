import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  ref as storageRef,
  deleteObject,
} from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { sanitizeFirestoreData } from '../utils/sanitize';
import { FileItem, Folder, ShareItem, UploadTaskItem } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface FileContextType {
  files: FileItem[];
  folders: Folder[];
  activeFolderId: string | null;
  setActiveFolderId: (id: string | null) => void;
  loading: boolean;
  uploadQueue: UploadTaskItem[];
  uploadFiles: (fileList: File[], targetFolderId?: string | null) => Promise<void>;
  cancelUpload: (uploadId: string) => void;
  clearCompletedUploads: () => void;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  moveFile: (fileId: string, targetFolderId: string | null) => Promise<void>;
  toggleFavorite: (fileId: string, currentStatus: boolean) => Promise<void>;
  softDeleteFile: (fileId: string) => Promise<void>;
  restoreFile: (fileId: string) => Promise<void>;
  permanentlyDeleteFile: (file: FileItem) => Promise<void>;
  emptyTrash: () => Promise<void>;
  createFolder: (name: string) => Promise<string>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  createOrGetShareLink: (file: FileItem) => Promise<string>;
  disableShareLink: (file: FileItem) => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const { showToast } = useToast();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadQueue, setUploadQueue] = useState<UploadTaskItem[]>([]);

  // Real-time synchronization for files and folders
  useEffect(() => {
    if (!currentUser || !isFirebaseConfigured) {
      setFiles([]);
      setFolders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const filesCollRef = collection(db, 'users', currentUser.uid, 'files');
    const foldersCollRef = collection(db, 'users', currentUser.uid, 'folders');

    const unsubscribeFiles = onSnapshot(
      filesCollRef,
      (snapshot) => {
        const loadedFiles: FileItem[] = [];
        snapshot.forEach((docSnap) => {
          loadedFiles.push(docSnap.data() as FileItem);
        });
        setFiles(loadedFiles);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${currentUser.uid}/files`);
        setLoading(false);
      }
    );

    const unsubscribeFolders = onSnapshot(
      foldersCollRef,
      (snapshot) => {
        const loadedFolders: Folder[] = [];
        snapshot.forEach((docSnap) => {
          loadedFolders.push(docSnap.data() as Folder);
        });
        loadedFolders.sort((a, b) => a.name.localeCompare(b.name));
        setFolders(loadedFolders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${currentUser.uid}/folders`);
      }
    );

    return () => {
      unsubscribeFiles();
      unsubscribeFolders();
    };
  }, [currentUser]);

  // Upload cancellation
  const cancelUpload = useCallback((uploadId: string) => {
    setUploadQueue((prev) =>
      prev.map((item) => {
        if (item.id === uploadId) {
          if (item.cancelFn) {
            item.cancelFn();
          }
          return { ...item, status: 'canceled' };
        }
        return item;
      })
    );
  }, []);

  const clearCompletedUploads = useCallback(() => {
    setUploadQueue((prev) => prev.filter((item) => item.status === 'uploading' || item.status === 'pending'));
  }, []);

  // Cloudinary Helper Function
  const uploadFileToCloudinary = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary environment variables missing');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          onProgress(percentCompleted);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error('Cloudinary Upload Failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  };

  const uploadFiles = useCallback(
    async (fileList: File[], targetFolderId: string | null = null) => {
      if (!currentUser) {
        showToast('error', 'Authentication Required', 'Please sign in to upload files.');
        return;
      }

      for (const file of fileList) {
        const uploadId = Math.random().toString(36).substring(2, 9);

        // Queue-তে স্টেটাস যোগ করা
        setUploadQueue((prev) => [
          ...prev,
          {
            id: uploadId,
            file,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'uploading',
          },
        ]);

        try {
          // ১. ক্লাউডিনারিতে আপলোড
          const downloadURL = await uploadFileToCloudinary(file, (progress) => {
            setUploadQueue((prev) =>
              prev.map((item) => (item.id === uploadId ? { ...item, progress } : item))
            );
          });

          // ২. ডাটাবেজে ফাইলের তথ্য সেভ
          const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newFileDoc = {
            fileId,
            fileName: file.name,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            downloadURL,
            storagePath: `cloudinary/${fileId}`,
            folderId: targetFolderId || activeFolderId || '',
            ownerId: currentUser.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isFavorite: false,
            isDeleted: false,
            shared: false,
          };

          const fileDocRef = doc(db, 'users', currentUser.uid, 'files', fileId);
          await setDoc(fileDocRef, sanitizeFirestoreData(newFileDoc));

          // Queue আপডেট
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === uploadId ? { ...item, progress: 100, status: 'completed' } : item
            )
          );

          showToast('success', 'Upload Complete', `${file.name} uploaded successfully.`);
        } catch (error) {
          console.error('Upload Error:', error);
          setUploadQueue((prev) =>
            prev.map((item) => (item.id === uploadId ? { ...item, status: 'error' } : item))
          );
          showToast('error', 'Upload Failed', `Failed to upload ${file.name}`);
        }
      }
    },
    [currentUser, activeFolderId, showToast]
  );

  // File Actions
  const renameFile = async (fileId: string, newName: string) => {
    if (!currentUser || !newName.trim()) return;
    try {
      const fileDocRef = doc(db, 'users', currentUser.uid, 'files', fileId);
      await updateDoc(
        fileDocRef,
        sanitizeFirestoreData({
          fileName: newName.trim(),
          updatedAt: new Date().toISOString(),
        })
      );
      showToast('success', 'File Renamed', `Renamed to ${newName.trim()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/files/${fileId}`);
    }
  };

  const moveFile = async (fileId: string, targetFolderId: string | null) => {
    if (!currentUser) return;
    try {
      const fileDocRef = doc(db, 'users', currentUser.uid, 'files', fileId);
      await updateDoc(
        fileDocRef,
        sanitizeFirestoreData({
          folderId: targetFolderId || '',
          updatedAt: new Date().toISOString(),
        })
      );
      const targetFolder = folders.find((f) => f.folderId === targetFolderId);
      showToast('success', 'File Moved', `Moved to ${targetFolder ? targetFolder.name : 'Root'}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/files/${fileId}`);
    }
  };

  const toggleFavorite = async (fileId: string, currentStatus: boolean) => {
    if (!currentUser) return;
    try {
      const fileDocRef = doc(db, 'users', currentUser.uid, 'files', fileId);
      await updateDoc(
        fileDocRef,
        sanitizeFirestoreData({
          isFavorite: !currentStatus,
          updatedAt: new Date().toISOString(),
        })
      );
      showToast(
        'info',
        !currentStatus ? 'Added to Favorites' : 'Removed from Favorites',
        undefined,
        2000
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/files/${fileId}`);
    }
  };

  const softDeleteFile = async (fileId: string) => {
    if (!currentUser) return;
    try {
      const fileDocRef = doc(db, 'users', currentUser.uid, 'files', fileId);
      await updateDoc(
        fileDocRef,
        sanitizeFirestoreData({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        })
      );
      showToast('info', 'Moved to Trash', 'File can be restored or permanently removed anytime.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/files/${fileId}`);
    }
  };

  const restoreFile = async (fileId: string) => {
    if (!currentUser) return;
    try {
      const fileDocRef = doc(db, 'users', currentUser.uid, 'files', fileId);
      await updateDoc(
        fileDocRef,
        sanitizeFirestoreData({
          isDeleted: false,
          deletedAt: null,
          updatedAt: new Date().toISOString(),
        })
      );
      showToast('success', 'File Restored', 'File is back in your files list.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/files/${fileId}`);
    }
  };

  const permanentlyDeleteFile = async (file: FileItem) => {
    if (!currentUser) return;
    try {
      // 1. Delete from Firebase Storage if path exists
      try {
        if (file.storagePath && !file.storagePath.startsWith('cloudinary/')) {
          const fRef = storageRef(storage, file.storagePath);
          await deleteObject(fRef);
        }
      } catch (storageErr) {
        console.warn('Storage file deletion note:', storageErr);
      }

      // 2. Delete Firestore doc
      const fileDocRef = doc(db, 'users', currentUser.uid, 'files', file.fileId);
      await deleteDoc(fileDocRef);

      // 3. Delete share doc if it had one
      if (file.shareId) {
        try {
          await deleteDoc(doc(db, 'shares', file.shareId));
        } catch {
          // Ignore
        }
      }

      showToast('info', 'File Deleted', `${file.fileName} permanently deleted.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/files/${file.fileId}`);
    }
  };

  const emptyTrash = async () => {
    if (!currentUser) return;
    const trashFiles = files.filter((f) => f.isDeleted);
    if (trashFiles.length === 0) {
      showToast('info', 'Trash is Empty', 'No files to purge.');
      return;
    }

    try {
      for (const file of trashFiles) {
        try {
          if (file.storagePath && !file.storagePath.startsWith('cloudinary/')) {
            const fRef = storageRef(storage, file.storagePath);
            await deleteObject(fRef);
          }
        } catch {
          // ignore
        }
        await deleteDoc(doc(db, 'users', currentUser.uid, 'files', file.fileId));
        if (file.shareId) {
          try {
            await deleteDoc(doc(db, 'shares', file.shareId));
          } catch {
            // ignore
          }
        }
      }

      showToast('success', 'Trash Emptied', `${trashFiles.length} files permanently removed.`);
    } catch (err) {
      console.error('Error emptying trash:', err);
      showToast('error', 'Error Emptying Trash', 'Some files could not be removed.');
    }
  };

  // Folder Operations
  const createFolder = async (name: string): Promise<string> => {
    if (!currentUser) throw new Error('Not authenticated');
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const folderDocRef = doc(db, 'users', currentUser.uid, 'folders', folderId);

    const newFolder: Folder = {
      folderId,
      ownerId: currentUser.uid,
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(folderDocRef, sanitizeFirestoreData(newFolder));
      showToast('success', 'Folder Created', `Folder "${name.trim()}" created successfully.`);
      return folderId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/folders/${folderId}`);
      throw err;
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    if (!currentUser || !newName.trim()) return;
    try {
      const folderDocRef = doc(db, 'users', currentUser.uid, 'folders', folderId);
      await updateDoc(
        folderDocRef,
        sanitizeFirestoreData({
          name: newName.trim(),
          updatedAt: new Date().toISOString(),
        })
      );
      showToast('success', 'Folder Renamed', `Renamed to "${newName.trim()}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/folders/${folderId}`);
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!currentUser) return;
    try {
      const folderFiles = files.filter((f) => f.folderId === folderId);
      for (const file of folderFiles) {
        const fRef = doc(db, 'users', currentUser.uid, 'files', file.fileId);
        await updateDoc(fRef, { folderId: '' });
      }

      const folderDocRef = doc(db, 'users', currentUser.uid, 'folders', folderId);
      await deleteDoc(folderDocRef);

      if (activeFolderId === folderId) {
        setActiveFolderId(null);
      }

      showToast('info', 'Folder Deleted', 'Files were moved to the main directory.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/folders/${folderId}`);
    }
  };

  // Share Operations
  const createOrGetShareLink = async (file: FileItem): Promise<string> => {
    if (!currentUser) throw new Error('Not authenticated');

    const shareId = file.shareId || `share_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const shareDocRef = doc(db, 'shares', shareId);

    const shareData: ShareItem = {
      shareId,
      fileId: file.fileId,
      ownerId: currentUser.uid,
      fileName: file.fileName,
      originalName: file.originalName,
      downloadURL: file.downloadURL,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      createdAt: file.createdAt || new Date().toISOString(),
      enabled: true,
    };

    try {
      await setDoc(shareDocRef, sanitizeFirestoreData(shareData));

      const fileDocRef = doc(db, 'users', currentUser.uid, 'files', file.fileId);
      await updateDoc(
        fileDocRef,
        sanitizeFirestoreData({
          shared: true,
          shareId,
          updatedAt: new Date().toISOString(),
        })
      );

      const shareUrl = `${window.location.origin}/share/${shareId}`;
      return shareUrl;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `shares/${shareId}`);
      throw err;
    }
  };

  const disableShareLink = async (file: FileItem) => {
    if (!currentUser || !file.shareId) return;
    try {
      const shareDocRef = doc(db, 'shares', file.shareId);
      await updateDoc(shareDocRef, { enabled: false });

      const fileDocRef = doc(db, 'users', currentUser.uid, 'files', file.fileId);
      await updateDoc(
        fileDocRef,
        sanitizeFirestoreData({
          shared: false,
          updatedAt: new Date().toISOString(),
        })
      );

      showToast('info', 'Sharing Disabled', 'Public link is no longer accessible.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `shares/${file.shareId}`);
    }
  };

  return (
    <FileContext.Provider
      value={{
        files,
        folders,
        activeFolderId,
        setActiveFolderId,
        loading,
        uploadQueue,
        uploadFiles,
        cancelUpload,
        clearCompletedUploads,
        renameFile,
        moveFile,
        toggleFavorite,
        softDeleteFile,
        restoreFile,
        permanentlyDeleteFile,
        emptyTrash,
        createFolder,
        renameFolder,
        deleteFolder,
        createOrGetShareLink,
        disableShareLink,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) throw new Error('useFiles must be used within FileProvider');
  return context;
};
