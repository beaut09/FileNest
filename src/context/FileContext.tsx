import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../firebase/config';
import { handleFirestoreError, OperationType, getFriendlyErrorMessage } from '../firebase/errors';
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
        // Sort folders alphabetically
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

  // Upload files with validation, progress, and real Firebase Storage integration
  const uploadFiles = useCallback(
    async (fileList: File[], targetFolderId: string | null = activeFolderId) => {
      if (!currentUser) {
        showToast('error', 'Authentication Required', 'Please log in to upload files.');
        return;
      }

      const totalSizeToUpload = fileList.reduce((acc, f) => acc + f.size, 0);
      const currentStorageUsed = userProfile?.storageUsed || 0;
      const currentStorageLimit = userProfile?.storageLimit || 10 * 1024 * 1024 * 1024;

      if (currentStorageUsed + totalSizeToUpload > currentStorageLimit) {
        showToast(
          'error',
          'Storage Limit Exceeded',
          'You do not have enough storage space for this upload. Please delete some files or upgrade.'
        );
        return;
      }

      for (const file of fileList) {
        const uploadId = Math.random().toString(36).substring(2, 9);
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `users/${currentUser.uid}/files/${fileId}/${cleanName}`;
        const fileRef = storageRef(storage, path);

        console.log(`[FileNest] Upload initiated for "${file.name}" (${file.size} bytes) -> "${path}"`);

        // Helper to record file metadata in Firestore and update storageUsed
        const recordFileMetadata = async (downloadURL: string) => {
          const now = new Date().toISOString();
          const newFileDoc: FileItem = {
            fileId,
            ownerId: currentUser.uid,
            fileName: file.name,
            originalName: file.name,
            storagePath: path,
            downloadURL,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
            folderId: targetFolderId || '',
            createdAt: now,
            updatedAt: now,
            isFavorite: false,
            isDeleted: false,
            shared: false,
            thumbnailURL: file.type.startsWith('image/') ? downloadURL : '',
          };

          const fileDocRef = doc(db, 'users', currentUser.uid, 'files', fileId);
          await setDoc(fileDocRef, sanitizeFirestoreData(newFileDoc));

          // Atomically update user's storage used
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, {
            storageUsed: increment(file.size),
          });

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === uploadId ? { ...item, progress: 100, status: 'completed' } : item
            )
          );

          showToast('success', 'File Uploaded', `${file.name} saved successfully.`);
        };

        const uploadTask = uploadBytesResumable(fileRef, file, {
          contentType: file.type || 'application/octet-stream',
        });

        const cancelFn = () => uploadTask.cancel();

        // Add to queue
        setUploadQueue((prev) => [
          ...prev,
          {
            id: uploadId,
            file,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'uploading',
            cancelFn,
          },
        ]);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress =
              snapshot.totalBytes > 0
                ? Math.min(100, Math.max(0, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)))
                : 0;
            console.log(`[FileNest] Progress for ${file.name}: ${progress}% (${snapshot.bytesTransferred}/${snapshot.totalBytes})`);
            setUploadQueue((prev) =>
              prev.map((item) => (item.id === uploadId ? { ...item, progress } : item))
            );
          },
          async (error) => {
            console.error(`[FileNest] Upload error for "${file.name}":`, error);
            const isCanceled = error.code === 'storage/canceled';

            // Resumable session fallback: if resumable upload is blocked by CORS/network on files < 25MB, try direct uploadBytes
            if (!isCanceled && (error.code === 'storage/unknown' || error.code === 'storage/retry-limit-exceeded') && file.size < 25 * 1024 * 1024) {
              console.warn(`[FileNest] Attempting direct single-request upload fallback for "${file.name}"...`);
              try {
                const directSnap = await uploadBytes(fileRef, file, {
                  contentType: file.type || 'application/octet-stream',
                });
                const downloadURL = await getDownloadURL(directSnap.ref);
                await recordFileMetadata(downloadURL);
                return;
              } catch (directErr) {
                console.error('[FileNest] Direct upload fallback also encountered an error:', directErr);
              }
            }

            const friendly = getFriendlyErrorMessage(error);
            setUploadQueue((prev) =>
              prev.map((item) =>
                item.id === uploadId
                  ? {
                      ...item,
                      status: isCanceled ? 'canceled' : 'error',
                      error: isCanceled ? 'Upload canceled' : friendly,
                    }
                  : item
              )
            );
            if (!isCanceled) {
              showToast('error', 'Upload Failed', `${file.name}: ${friendly}`);
            }
          },
          async () => {
            // Upload successful
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              await recordFileMetadata(downloadURL);
            } catch (err: any) {
              console.error('Error saving file metadata:', err);
              setUploadQueue((prev) =>
                prev.map((item) =>
                  item.id === uploadId
                    ? { ...item, status: 'error', error: 'Failed to save file metadata.' }
                    : item
                )
              );
              showToast('error', 'Error Saving File', 'Unable to record file metadata.');
            }
          }
        );
      }
    },
    [currentUser, userProfile, activeFolderId, showToast]
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
      // 1. Delete from Firebase Storage
      try {
        const fRef = storageRef(storage, file.storagePath);
        await deleteObject(fRef);
      } catch (storageErr) {
        console.warn('Storage file deletion note (may already be deleted):', storageErr);
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

      // 4. Update user's storageUsed in Firestore (safeguarded against negative values)
      const userDocRef = doc(db, 'users', currentUser.uid);
      const currentStorageUsed = userProfile?.storageUsed || 0;
      const updatedStorageUsed = Math.max(0, currentStorageUsed - file.fileSize);
      await updateDoc(userDocRef, {
        storageUsed: updatedStorageUsed,
      });

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
      let totalBytesFreed = 0;
      for (const file of trashFiles) {
        try {
          const fRef = storageRef(storage, file.storagePath);
          await deleteObject(fRef);
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
        totalBytesFreed += file.fileSize;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const currentStorageUsed = userProfile?.storageUsed || 0;
      const updatedStorageUsed = Math.max(0, currentStorageUsed - totalBytesFreed);
      await updateDoc(userDocRef, {
        storageUsed: updatedStorageUsed,
      });

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
      // Move all files in this folder to root
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

      // Update file doc with shareId and shared=true
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
