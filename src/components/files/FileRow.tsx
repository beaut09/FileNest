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
import { formatBytes, formatDate, downloadFile } from '../../utils/sanitize';
import { FileIcon } from './FileIcon';
import { useFiles } from '../../context/FileContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';

interface FileRowProps {
  file: FileItem;
  folders: Folder[];
  onPreview: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onMove: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export const FileRow: React.FC<FileRowProps> = ({
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

  return (
    <tr
      onClick={() => onPreview(file)}
      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer transition-colors text-xs sm:text-sm text-slate-700 dark:text-slate-300"
    >
      {/* Favorite Star */}
      <td className="w-8 py-3.5 pl-4 pr-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(file.fileId, file.isFavorite);
          }}
          className={`p-1 rounded-md transition-colors ${
            file.isFavorite
              ? 'text-amber-500'
              : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'
          }`}
          title={file.isFavorite ? t.unfavorite : t.favorite}
        >
          <Star className="w-4 h-4 fill-current" />
        </button>
      </td>

      {/* Name and Icon */}
      <td className="py-3.5 px-3 min-w-[180px] max-w-xs">
        <div className="flex items-center gap-3">
          <FileIcon mimeType={file.mimeType} fileName={file.fileName} className="w-5 h-5 shrink-0" />
          <span className="font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {file.fileName}
          </span>
        </div>
      </td>

      {/* Folder */}
      <td className="py-3.5 px-3 hidden md:table-cell text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
        {folderName ? (
          <span className="px-2 py-0.5 text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md">
            📁 {folderName}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">Root</span>
        )}
      </td>

      {/* File Size */}
      <td className="py-3.5 px-3 hidden sm:table-cell text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {formatBytes(file.fileSize)}
      </td>

      {/* Upload/Modified Date */}
      <td className="py-3.5 px-3 hidden lg:table-cell text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {formatDate(file.updatedAt || file.createdAt)}
      </td>

      {/* Actions */}
      <td className="py-3.5 pr-4 pl-2 text-right">
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => downloadFile(file.downloadURL, file.fileName)}
            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title={t.download}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => onShare(file)}
            className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title={t.share}
          >
            <Share2 className="w-4 h-4" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs text-slate-700 dark:text-slate-200">
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
      </td>
    </tr>
  );
};
