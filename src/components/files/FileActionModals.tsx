import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Folder as FolderIcon,
  Trash2,
  AlertTriangle,
  Link,
  Edit2,
  FolderPlus,
} from 'lucide-react';
import { FileItem, Folder } from '../../types';
import { useFiles } from '../../context/FileContext';
import { useToast } from '../../context/ToastContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { formatBytes } from '../../utils/sanitize';

// --- RENAME MODAL ---
interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: FileItem | null;
  folder?: Folder | null;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  file,
  folder,
}) => {
  const { renameFile, renameFolder } = useFiles();
  const { t } = useThemeLanguage();

  const [newName, setNewName] = useState<string>(
    file ? file.fileName : folder ? folder.name : ''
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (file) setNewName(file.fileName);
    else if (folder) setNewName(folder.name);
  }, [file, folder]);

  if (!isOpen || (!file && !folder)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (file) {
        await renameFile(file.fileId, newName.trim());
      } else if (folder) {
        await renameFolder(folder.folderId, newName.trim());
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-blue-500" />
            {t.rename} {file ? 'File' : 'Folder'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              New Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {submitting ? 'Saving...' : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MOVE MODAL ---
interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
  folders: Folder[];
}

export const MoveModal: React.FC<MoveModalProps> = ({ isOpen, onClose, file, folders }) => {
  const { moveFile } = useFiles();
  const { t } = useThemeLanguage();

  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (file) {
      setSelectedFolderId(file.folderId || '');
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleMove = async () => {
    setSubmitting(true);
    try {
      await moveFile(file.fileId, selectedFolderId || null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderIcon className="w-4 h-4 text-blue-500" />
            {t.move} "{file.fileName}"
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Select Destination Folder:
          </label>

          {/* Root Directory Option */}
          <button
            type="button"
            onClick={() => setSelectedFolderId('')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition ${
              selectedFolderId === ''
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
            }`}
          >
            <FolderIcon className="w-4 h-4 shrink-0 text-slate-400" />
            <span>Root / All Files</span>
          </button>

          {folders.map((f) => (
            <button
              key={f.folderId}
              type="button"
              onClick={() => setSelectedFolderId(f.folderId)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition ${
                selectedFolderId === f.folderId
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
              }`}
            >
              <FolderIcon className="w-4 h-4 shrink-0 text-blue-500" />
              <span className="truncate">{f.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition"
          >
            {submitting ? 'Moving...' : t.move}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SHARE MODAL ---
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, file }) => {
  const { createOrGetShareLink, disableShareLink } = useFiles();
  const { showToast } = useToast();
  const { t } = useThemeLanguage();

  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  React.useEffect(() => {
    if (file && isOpen) {
      if (file.shared && file.shareId) {
        setShareUrl(`${window.location.origin}/share/${file.shareId}`);
      } else {
        setShareUrl('');
      }
    }
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const url = await createOrGetShareLink(file);
      setShareUrl(url);
      showToast('success', 'Link Created', 'Shareable link is now active.');
    } catch {
      showToast('error', 'Error', 'Failed to generate link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('success', t.linkCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Clipboard error', 'Could not copy to clipboard.');
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await disableShareLink(file);
      setShareUrl('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-500" />
            {t.share} "{file.fileName}"
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Anyone with this link can view the preview and download this file directly. Private files remain completely secure until you enable link sharing.
          </p>

          {shareUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <Link className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-200 w-full focus:outline-none font-mono truncate"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <button
                onClick={handleDisable}
                disabled={loading}
                className="w-full py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50 transition"
              >
                {t.disableSharing}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <button
                onClick={handleGenerateLink}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-md transition"
              >
                <Link className="w-4 h-4" />
                {loading ? 'Generating...' : 'Generate Shareable Link'}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- DELETE CONFIRMATION MODAL ---
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: FileItem | null;
  folder?: Folder | null;
  permanent?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  file,
  folder,
  permanent = false,
}) => {
  const { softDeleteFile, permanentlyDeleteFile, deleteFolder } = useFiles();
  const { t } = useThemeLanguage();
  const [deleting, setDeleting] = useState<boolean>(false);

  if (!isOpen || (!file && !folder)) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      if (file) {
        if (permanent) {
          await permanentlyDeleteFile(file);
        } else {
          await softDeleteFile(file.fileId);
        }
      } else if (folder) {
        await deleteFolder(folder.folderId);
      }
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {permanent ? t.permanentDelete : t.delete}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {permanent
                ? `Are you sure you want to permanently delete "${file?.fileName}"? This will free ${formatBytes(
                    file?.fileSize || 0
                  )} and cannot be undone.`
                : folder
                ? `Delete folder "${folder.name}"? Files inside will be safely moved to Root.`
                : `Move "${file?.fileName}" to Trash? You can restore it later.`}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-5 border-t border-slate-100 dark:border-slate-800 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition"
          >
            {deleting ? 'Deleting...' : t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CREATE FOLDER MODAL ---
interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose }) => {
  const { createFolder } = useFiles();
  const { t } = useThemeLanguage();

  const [folderName, setFolderName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim() || submitting) return;

    setSubmitting(true);
    try {
      await createFolder(folderName.trim());
      setFolderName('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-500" />
            {t.newFolder}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Folder Name
            </label>
            <input
              type="text"
              placeholder="e.g. Work Documents, Photos 2026"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || !folderName.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {submitting ? 'Creating...' : t.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
