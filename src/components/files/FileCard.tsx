import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Download,
  Eye,
  Edit2,
  FolderInput,
  Star,
  Share2,
  Trash2,
} from 'lucide-react';
import { FileItem, Folder } from '../../types';
import { formatBytes, formatDate, isImageFile, downloadFile } from '../../utils/sanitize';
import { FileIcon } from './FileIcon';
import { useFiles } from '../../context/FileContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';

interface FileCardProps {
  file: FileItem;
  folders: Folder[];
  onPreview: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onMove: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  folders,
  onPreview,
  onRename,
  onMove,
  onShare,
  onDelete,
}) => {
  const { toggleFavorite } = useFiles();
  const { t } = useThemeLanguage();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const folderName = folders.find((f) => f.folderId === file.folderId)?.name;
  const isImg = isImageFile(file.mimeType, file.fileName);

  return (
    <div
      onClick={() => onPreview(file)}
      className="group relative flex flex-col justify-between p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top action row */}
      <div className="flex items-center justify-between gap-1 mb-3">
        <span
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(file.fileId, file.isFavorite);
          }}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            file.isFavorite
              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
              : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={file.isFavorite ? t.unfavorite : t.favorite}
        >
          <Star className="w-4 h-4 fill-current" />
        </span>

        {/* More Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs text-slate-700 dark:text-slate-200"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onPreview(file);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/70 text-left transition"
              >
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>{t.preview}</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  downloadFile(file.downloadURL, file.fileName);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/70 text-left transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.download}</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onShare(file);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/70 text-left transition"
              >
                <Share2 className="w-3.5 h-3.5 text-purple-500" />
                <span>{t.share}</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onRename(file);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/70 text-left transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.rename}</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onMove(file);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/70 text-left transition"
              >
                <FolderInput className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t.move}</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(file);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-left transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.delete}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail or File Icon */}
      <div className="flex items-center justify-center h-28 w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl overflow-hidden mb-3 border border-slate-100 dark:border-slate-800/60">
        {isImg ? (
          <img
            src={file.downloadURL}
            alt={file.fileName}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <FileIcon mimeType={file.mimeType} fileName={file.fileName} className="w-12 h-12" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <h4
          className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          title={file.fileName}
        >
          {file.fileName}
        </h4>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span>{formatBytes(file.fileSize)}</span>
          <span>{formatDate(file.updatedAt || file.createdAt)}</span>
        </div>

        {folderName && (
          <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-md truncate max-w-full">
            📁 {folderName}
          </span>
        )}
      </div>
    </div>
  );
};
