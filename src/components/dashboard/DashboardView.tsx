import React from 'react';
import {
  FileText,
  HardDrive,
  CheckCircle2,
  Clock,
  Star,
  UploadCloud,
  FolderPlus,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  Archive,
  Layers,
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { useAuth } from '../../context/AuthContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { formatBytes, formatDate, getFileCategory } from '../../utils/sanitize';
import { FileItem, Folder, ActiveNavTab, FileCategory } from '../../types';
import { FileCard } from '../files/FileCard';
import { FileRow } from '../files/FileRow';
import { FileIcon } from '../files/FileIcon';

interface DashboardViewProps {
  onOpenUpload: () => void;
  onOpenCreateFolder: () => void;
  onPreviewFile: (file: FileItem) => void;
  onRenameFile: (file: FileItem) => void;
  onMoveFile: (file: FileItem) => void;
  onShareFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
  setActiveTab: (tab: ActiveNavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenUpload,
  onOpenCreateFolder,
  onPreviewFile,
  onRenameFile,
  onMoveFile,
  onShareFile,
  onDeleteFile,
  setActiveTab,
}) => {
  const { files, folders } = useFiles();
  const { userProfile, currentUser } = useAuth();
  const { t } = useThemeLanguage();

  const activeFiles = files.filter((f) => !f.isDeleted);
  const favoriteFiles = activeFiles.filter((f) => f.isFavorite);
  const recentFiles = [...activeFiles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const totalUsed = userProfile?.storageUsed || 0;
  const storageLimit = userProfile?.storageLimit || 10 * 1024 * 1024 * 1024;
  const storageAvailable = Math.max(0, storageLimit - totalUsed);
  const usagePercent = Math.min(100, Math.round((totalUsed / storageLimit) * 100));

  // Category breakdown calculation
  const categoryStats: Record<
    Exclude<FileCategory, 'all'>,
    { count: number; bytes: number; label: string; color: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    images: { count: 0, bytes: 0, label: t.images, color: 'bg-rose-500', icon: ImageIcon },
    documents: { count: 0, bytes: 0, label: t.documents, color: 'bg-blue-500', icon: FileText },
    videos: { count: 0, bytes: 0, label: t.videos, color: 'bg-purple-500', icon: VideoIcon },
    audio: { count: 0, bytes: 0, label: t.audio, color: 'bg-amber-500', icon: Music },
    archives: { count: 0, bytes: 0, label: t.archives, color: 'bg-yellow-500', icon: Archive },
    other: { count: 0, bytes: 0, label: t.other, color: 'bg-slate-400', icon: Layers },
  };

  activeFiles.forEach((file) => {
    const cat = getFileCategory(file.mimeType, file.fileName);
    if (cat !== 'all' && cat in categoryStats) {
      categoryStats[cat].count += 1;
      categoryStats[cat].bytes += file.fileSize;
    } else {
      categoryStats.other.count += 1;
      categoryStats.other.bytes += file.fileSize;
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="relative z-10 max-w-xl">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
            Secure Cloud Vault
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {userProfile?.name || currentUser?.displayName || 'Friend'}!
          </h2>
          <p className="text-sm text-blue-100 mt-2 leading-relaxed">
            Store, sync, preview, and share your documents, photos, videos, and archives safely across all your devices.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:scale-98 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition"
            >
              <UploadCloud className="w-4 h-4" />
              {t.uploadFile}
            </button>
            <button
              onClick={onOpenCreateFolder}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-xs sm:text-sm backdrop-blur transition border border-white/20"
            >
              <FolderPlus className="w-4 h-4" />
              {t.newFolder}
            </button>
          </div>
        </div>

        {/* Subtle decorative circles */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Storage & Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Files */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.totalFiles}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {activeFiles.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Across {folders.length} folder{folders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Storage Used */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.storageUsed}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatBytes(totalUsed)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">{usagePercent}% of limit</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        {/* Storage Available */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.storageAvailable}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatBytes(storageAvailable)}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready for upload
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Favorite Files */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.favorites}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {favoriteFiles.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Starred files</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
            <Star className="w-6 h-6 fill-current" />
          </div>
        </div>
      </div>

      {/* Visual Storage Breakdown Progress Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-500" />
              {t.storageBreakdown}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formatBytes(totalUsed)} used of {formatBytes(storageLimit)} ({usagePercent}%)
            </p>
          </div>
          <button
            onClick={() => setActiveTab('storage')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Detailed Storage Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Multi-color segment progress bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          {Object.entries(categoryStats).map(([key, stat]) => {
            const pct = totalUsed > 0 ? (stat.bytes / totalUsed) * usagePercent : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={key}
                className={`${stat.color} h-full transition-all duration-300`}
                style={{ width: `${pct}%` }}
                title={`${stat.label}: ${formatBytes(stat.bytes)}`}
              />
            );
          })}
        </div>

        {/* Category legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
          {Object.entries(categoryStats).map(([key, stat]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className={`w-2.5 h-2.5 rounded-full ${stat.color} shrink-0`} />
              <span className="truncate">{stat.label}</span>
              <span className="text-[11px] font-mono text-slate-400 ml-auto">
                {formatBytes(stat.bytes)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Uploaded Files */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {t.recentlyUploaded}
            </h3>
          </div>
          {activeFiles.length > 6 && (
            <button
              onClick={() => setActiveTab('files')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All Files</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentFiles.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t.noFilesYet}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              {t.noFilesDesc}
            </p>
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm transition"
            >
              {t.uploadFile}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentFiles.map((file) => (
              <FileCard
                key={file.fileId}
                file={file}
                folders={folders}
                onPreview={onPreviewFile}
                onRename={onRenameFile}
                onMove={onMoveFile}
                onShare={onShareFile}
                onDelete={onDeleteFile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Favorite Files Section if any exist */}
      {favoriteFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {t.favorites}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('favorites')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All Favorites</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {favoriteFiles.slice(0, 6).map((file) => (
              <FileCard
                key={file.fileId}
                file={file}
                folders={folders}
                onPreview={onPreviewFile}
                onRename={onRenameFile}
                onMove={onMoveFile}
                onShare={onShareFile}
                onDelete={onDeleteFile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
