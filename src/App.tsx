import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { ThemeLanguageProvider, useThemeLanguage } from './context/ThemeLanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FileProvider, useFiles } from './context/FileContext';
import { ActiveNavTab, FileItem, Folder } from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { FileManagerView } from './components/files/FileManagerView';
import { FolderView } from './components/folders/FolderView';
import { TrashView } from './components/trash/TrashView';
import { StorageView } from './components/storage/StorageView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { SharedFileView } from './components/share/SharedFileView';
import { AuthModal } from './components/auth/AuthModal';
import { FilePreviewModal } from './components/files/FilePreviewModal';
import {
  RenameModal,
  MoveModal,
  ShareModal,
  DeleteConfirmModal,
  CreateFolderModal,
} from './components/files/FileActionModals';
import { UploadModal } from './components/upload/UploadModal';
import { UploadDrawer } from './components/upload/UploadDrawer';
import { FirebaseSetupBanner } from './components/common/FirebaseSetupBanner';
import { isFirebaseConfigured } from './firebase/config';
import { Cloud, UploadCloud } from 'lucide-react';

function AppContent() {
  const { currentUser, loading: authLoading } = useAuth();
  const { folders, setActiveFolderId } = useFiles();
  const { t } = useThemeLanguage();

  // If Firebase configuration is missing, show helpful developer setup notice
  if (!isFirebaseConfigured) {
    return <FirebaseSetupBanner />;
  }

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [movingFile, setMovingFile] = useState<FileItem | null>(null);
  const [sharingFile, setSharingFile] = useState<FileItem | null>(null);
  const [deletingFile, setDeletingFile] = useState<FileItem | null>(null);
  const [permanentDelete, setPermanentDelete] = useState<boolean>(false);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);

  // Global window drag & drop
  const [isWindowDragging, setIsWindowDragging] = useState<boolean>(false);

  // Check URL pathname for /share/:shareId routing
  const [currentShareId, setCurrentShareId] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/share/')) {
      const id = path.replace('/share/', '').trim();
      return id || null;
    }
    return null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/share/')) {
        setCurrentShareId(path.replace('/share/', '').trim() || null);
      } else {
        setCurrentShareId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global drag-and-drop listener
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsWindowDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsWindowDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsWindowDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        setUploadModalOpen(true);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Public shared file route handler
  if (currentShareId) {
    return (
      <SharedFileView
        shareId={currentShareId}
        onGoToApp={() => {
          window.history.pushState({}, '', '/');
          setCurrentShareId(null);
        }}
      />
    );
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/25 mb-4 animate-bounce">
          <Cloud className="w-8 h-8 fill-current" />
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          FileNest
        </h2>
        <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
          <div className="w-full h-full bg-blue-600 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // Unauthenticated user -> Login & Signup Screen
  if (!currentUser) {
    return <AuthModal />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Drag & Drop Fullscreen Overlay */}
      {isWindowDragging && (
        <div className="fixed inset-0 z-50 bg-blue-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white pointer-events-none p-6 animate-in fade-in duration-150">
          <div className="w-24 h-24 rounded-3xl bg-white/20 border-2 border-white/40 border-dashed flex items-center justify-center mb-4">
            <UploadCloud className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold">Drop files here to upload to FileNest</h2>
          <p className="text-sm opacity-90 mt-1">Files will be safely uploaded to your cloud vault</p>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setUploadModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenUpload={() => setUploadModalOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* View Router Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenUpload={() => setUploadModalOpen(true)}
              onOpenCreateFolder={() => setCreateFolderModalOpen(true)}
              onPreviewFile={(f) => setPreviewFile(f)}
              onRenameFile={(f) => setRenamingFile(f)}
              onMoveFile={(f) => setMovingFile(f)}
              onShareFile={(f) => setSharingFile(f)}
              onDeleteFile={(f) => {
                setDeletingFile(f);
                setPermanentDelete(false);
              }}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'files' && (
            <FileManagerView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenUpload={() => setUploadModalOpen(true)}
              onOpenCreateFolder={() => setCreateFolderModalOpen(true)}
              onPreviewFile={(f) => setPreviewFile(f)}
              onRenameFile={(f) => setRenamingFile(f)}
              onMoveFile={(f) => setMovingFile(f)}
              onShareFile={(f) => setSharingFile(f)}
              onDeleteFile={(f) => {
                setDeletingFile(f);
                setPermanentDelete(false);
              }}
              filterMode="all"
            />
          )}

          {activeTab === 'folders' && (
            <FolderView
              onOpenCreateFolder={() => setCreateFolderModalOpen(true)}
              onRenameFolder={(fol) => setRenamingFolder(fol)}
              onDeleteFolder={(fol) => setDeletingFolder(fol)}
              onOpenFolderFiles={(folId) => {
                setActiveFolderId(folId);
                setActiveTab('files');
              }}
            />
          )}

          {activeTab === 'recent' && (
            <FileManagerView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenUpload={() => setUploadModalOpen(true)}
              onOpenCreateFolder={() => setCreateFolderModalOpen(true)}
              onPreviewFile={(f) => setPreviewFile(f)}
              onRenameFile={(f) => setRenamingFile(f)}
              onMoveFile={(f) => setMovingFile(f)}
              onShareFile={(f) => setSharingFile(f)}
              onDeleteFile={(f) => {
                setDeletingFile(f);
                setPermanentDelete(false);
              }}
              filterMode="recent"
            />
          )}

          {activeTab === 'shared' && (
            <FileManagerView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenUpload={() => setUploadModalOpen(true)}
              onOpenCreateFolder={() => setCreateFolderModalOpen(true)}
              onPreviewFile={(f) => setPreviewFile(f)}
              onRenameFile={(f) => setRenamingFile(f)}
              onMoveFile={(f) => setMovingFile(f)}
              onShareFile={(f) => setSharingFile(f)}
              onDeleteFile={(f) => {
                setDeletingFile(f);
                setPermanentDelete(false);
              }}
              filterMode="shared"
            />
          )}

          {activeTab === 'favorites' && (
            <FileManagerView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenUpload={() => setUploadModalOpen(true)}
              onOpenCreateFolder={() => setCreateFolderModalOpen(true)}
              onPreviewFile={(f) => setPreviewFile(f)}
              onRenameFile={(f) => setRenamingFile(f)}
              onMoveFile={(f) => setMovingFile(f)}
              onShareFile={(f) => setSharingFile(f)}
              onDeleteFile={(f) => {
                setDeletingFile(f);
                setPermanentDelete(false);
              }}
              filterMode="favorites"
            />
          )}

          {activeTab === 'trash' && (
            <TrashView
              onPermanentDelete={(file) => {
                setDeletingFile(file);
                setPermanentDelete(true);
              }}
            />
          )}

          {activeTab === 'storage' && (
            <StorageView
              onPreviewFile={(f) => setPreviewFile(f)}
              onDeleteFile={(f) => {
                setDeletingFile(f);
                setPermanentDelete(false);
              }}
            />
          )}

          {activeTab === 'profile' && <ProfileView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Floating Upload Queue Drawer */}
      <UploadDrawer />

      {/* Dialog Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />

      <CreateFolderModal
        isOpen={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
      />

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onShare={(f) => {
          setPreviewFile(null);
          setSharingFile(f);
        }}
        folders={folders}
      />

      <RenameModal
        isOpen={Boolean(renamingFile || renamingFolder)}
        onClose={() => {
          setRenamingFile(null);
          setRenamingFolder(null);
        }}
        file={renamingFile}
        folder={renamingFolder}
      />

      <MoveModal
        isOpen={Boolean(movingFile)}
        onClose={() => setMovingFile(null)}
        file={movingFile}
        folders={folders}
      />

      <ShareModal
        isOpen={Boolean(sharingFile)}
        onClose={() => setSharingFile(null)}
        file={sharingFile}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingFile || deletingFolder)}
        onClose={() => {
          setDeletingFile(null);
          setDeletingFolder(null);
          setPermanentDelete(false);
        }}
        file={deletingFile}
        folder={deletingFolder}
        permanent={permanentDelete}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ThemeLanguageProvider>
        <AuthProvider>
          <FileProvider>
            <AppContent />
          </FileProvider>
        </AuthProvider>
      </ThemeLanguageProvider>
    </ToastProvider>
  );
}
