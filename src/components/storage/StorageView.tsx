import React from 'react';
import {
  HardDrive,
  PieChart,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  Archive,
  Layers,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { useAuth } from '../../context/AuthContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { formatBytes, formatDate, getFileCategory, downloadFile } from '../../utils/sanitize';
import { FileItem, FileCategory } from '../../types';
import { FileIcon } from '../files/FileIcon';

interface StorageViewProps {
  onPreviewFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
}

export const StorageView: React.FC<StorageViewProps> = ({
  onPreviewFile,
  onDeleteFile,
}) => {
  const { files } = useFiles();
  const { userProfile } = useAuth();
  const { t } = useThemeLanguage();

  const totalUsed = userProfile?.storageUsed || 0;
  const storageLimit = userProfile?.storageLimit || 10 * 1024 * 1024 * 1024;
  const remaining = Math.max(0, storageLimit - totalUsed);
  const usagePercent = Math.min(100, Math.round((totalUsed / storageLimit) * 100));

  const activeFiles = files.filter((f) => !f.isDeleted);

  // Group by category
  const categories: Record<
    Exclude<FileCategory, 'all'>,
    { label: string; count: number; bytes: number; color: string; barColor: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    images: { label: t.images, count: 0, bytes: 0, color: 'bg-rose-500', barColor: 'bg-rose-500', icon: ImageIcon },
    documents: { label: t.documents, count: 0, bytes: 0, color: 'bg-blue-500', barColor: 'bg-blue-500', icon: FileText },
    videos: { label: t.videos, count: 0, bytes: 0, color: 'bg-purple-500', barColor: 'bg-purple-500', icon: VideoIcon },
    audio: { label: t.audio, count: 0, bytes: 0, color: 'bg-amber-500', barColor: 'bg-amber-500', icon: Music },
    archives: { label: t.archives, count: 0, bytes: 0, color: 'bg-yellow-500', barColor: 'bg-yellow-500', icon: Archive },
    other: { label: t.other, count: 0, bytes: 0, color: 'bg-slate-400', barColor: 'bg-slate-400', icon: Layers },
  };

  activeFiles.forEach((file) => {
    const cat = getFileCategory(file.mimeType, file.fileName);
    if (cat !== 'all' && cat in categories) {
      categories[cat].count += 1;
      categories[cat].bytes += file.fileSize;
    } else {
      categories.other.count += 1;
      categories.other.bytes += file.fileSize;
    }
  });

  // Largest files
  const largestFiles = [...activeFiles]
    .sort((a, b) => b.fileSize - a.fileSize)
    .slice(0, 10);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-blue-500" />
          {t.storage}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Detailed metrics of your cloud capacity and file distribution
        </p>
      </div>

      {/* Main Storage Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Personal Vault
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {formatBytes(totalUsed)} <span className="text-lg font-normal text-slate-400">used of</span> {formatBytes(storageLimit)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You have <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatBytes(remaining)}</span> of free space remaining ({100 - usagePercent}%)
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-right">
              <p className="text-[11px] text-slate-400 uppercase font-medium">Status</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {usagePercent > 90 ? 'Critical' : usagePercent > 70 ? 'High' : 'Healthy'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">
              {usagePercent}%
            </div>
          </div>
        </div>

        {/* Large Multi-category Segmented Bar */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {Object.entries(categories).map(([key, cat]) => {
              const pct = totalUsed > 0 ? (cat.bytes / totalUsed) * usagePercent : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={key}
                  className={`${cat.barColor} h-full transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                  title={`${cat.label}: ${formatBytes(cat.bytes)}`}
                />
              );
            })}
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {Object.entries(categories).map(([key, cat]) => {
            const Icon = cat.icon;
            const pct = totalUsed > 0 ? Math.round((cat.bytes / totalUsed) * 100) : 0;
            return (
              <div
                key={key}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-xl ${cat.color} text-white flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{pct}%</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {cat.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {cat.count} files • {formatBytes(cat.bytes)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Largest Files Table */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Largest Files
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Files taking up the most storage space in your vault
          </p>
        </div>

        {largestFiles.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No files in storage yet.</p>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/40">
                    <th className="py-3 px-4">{t.name}</th>
                    <th className="py-3 px-3">{t.size}</th>
                    <th className="py-3 px-3 hidden sm:table-cell">{t.type}</th>
                    <th className="py-3 px-3 hidden md:table-cell">Uploaded</th>
                    <th className="py-3 pr-4 pl-2 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {largestFiles.map((file) => (
                    <tr
                      key={file.fileId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => onPreviewFile(file)}
                    >
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <FileIcon mimeType={file.mimeType} fileName={file.fileName} className="w-5 h-5 shrink-0" />
                          <span className="font-medium text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 transition">
                            {file.fileName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {formatBytes(file.fileSize)}
                      </td>

                      <td className="py-3 px-3 hidden sm:table-cell text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                        {file.mimeType || 'unknown'}
                      </td>

                      <td className="py-3 px-3 hidden md:table-cell text-slate-500 dark:text-slate-400">
                        {formatDate(file.createdAt)}
                      </td>

                      <td className="py-3 pr-4 pl-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onPreviewFile(file)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title={t.preview}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadFile(file.downloadURL, file.fileName)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title={t.download}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteFile(file)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                            title={t.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
