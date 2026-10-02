import React from 'react';
import {
  Folder as FolderIcon,
  FolderPlus,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { Folder } from '../../types';
import { formatDate, formatBytes } from '../../utils/sanitize';

interface FolderViewProps {
  onOpenCreateFolder: () => void;
  onRenameFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onOpenFolderFiles: (folderId: string) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({
  onOpenCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onOpenFolderFiles,
}) => {
  const { folders, files } = useFiles();
  const { t } = useThemeLanguage();

  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.folders}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize your documents, projects, media, and archives
          </p>
        </div>

        <button
          onClick={onOpenCreateFolder}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-sm transition self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>{t.newFolder}</span>
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mx-auto mb-3">
            <FolderPlus className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {t.noFoldersYet}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {t.noFoldersDesc}
          </p>
          <button
            onClick={onOpenCreateFolder}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            {t.newFolder}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => {
            const folderFiles = files.filter(
              (f) => !f.isDeleted && f.folderId === folder.folderId
            );
            const folderSize = folderFiles.reduce((acc, f) => acc + f.fileSize, 0);

            return (
              <div
                key={folder.folderId}
                onClick={() => onOpenFolderFiles(folder.folderId)}
                className="group relative flex flex-col justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition">
                      <FolderIcon className="w-5 h-5 fill-current" />
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(
                            activeMenuId === folder.folderId ? null : folder.folderId
                          );
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === folder.folderId && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onRenameFolder(folder);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                            <span>{t.rename}</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDeleteFolder(folder);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t.delete}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {folder.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {folderFiles.length} file{folderFiles.length !== 1 ? 's' : ''} •{' '}
                    {formatBytes(folderSize)}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(folder.createdAt)}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
