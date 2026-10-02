import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Folder as FolderIcon,
  HardDrive,
  Calendar,
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { FileItem } from '../../types';
import { formatBytes, formatDate } from '../../utils/sanitize';
import { FileIcon } from '../files/FileIcon';

interface TrashViewProps {
  onPermanentDelete: (file: FileItem) => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ onPermanentDelete }) => {
  const { files, folders, restoreFile, emptyTrash } = useFiles();
  const { t } = useThemeLanguage();

  const [confirmEmpty, setConfirmEmpty] = useState<boolean>(false);
  const [emptying, setEmptying] = useState<boolean>(false);

  const trashFiles = files.filter((f) => f.isDeleted);
  const totalTrashSize = trashFiles.reduce((acc, f) => acc + f.fileSize, 0);

  const handleEmptyTrash = async () => {
    setEmptying(true);
    try {
      await emptyTrash();
      setConfirmEmpty(false);
    } finally {
      setEmptying(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-rose-500" />
            {t.trash}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {trashFiles.length} file{trashFiles.length !== 1 ? 's' : ''} in trash •{' '}
            {formatBytes(totalTrashSize)}
          </p>
        </div>

        {trashFiles.length > 0 && (
          <div>
            {!confirmEmpty ? (
              <button
                onClick={() => setConfirmEmpty(true)}
                className="px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl transition"
              >
                {t.emptyTrash}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                <span className="text-xs text-rose-700 dark:text-rose-300 font-medium px-2">
                  Permanently erase all?
                </span>
                <button
                  onClick={handleEmptyTrash}
                  disabled={emptying}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  {emptying ? 'Purging...' : 'Yes, Purge'}
                </button>
                <button
                  onClick={() => setConfirmEmpty(false)}
                  className="px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                >
                  {t.cancel}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trash notice */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Items in trash still count toward your storage.</p>
          <p className="opacity-90 mt-0.5">
            Files in trash can be restored at any time. Permanently deleting them will free up storage space.
          </p>
        </div>
      </div>

      {trashFiles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {t.trashIsEmpty}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {t.trashIsEmptyDesc}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="py-3 px-4">{t.name}</th>
                  <th className="py-3 px-3 hidden md:table-cell">{t.folder}</th>
                  <th className="py-3 px-3 hidden sm:table-cell">{t.size}</th>
                  <th className="py-3 px-3 hidden lg:table-cell">Deleted At</th>
                  <th className="py-3 pr-4 pl-2 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trashFiles.map((file) => {
                  const folder = folders.find((f) => f.folderId === file.folderId);
                  return (
                    <tr
                      key={file.fileId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <FileIcon mimeType={file.mimeType} fileName={file.fileName} className="w-5 h-5 shrink-0" />
                          <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {file.fileName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 hidden md:table-cell text-slate-500 dark:text-slate-400">
                        {folder ? `📁 ${folder.name}` : 'Root'}
                      </td>

                      <td className="py-3 px-3 hidden sm:table-cell text-slate-500 dark:text-slate-400 font-mono">
                        {formatBytes(file.fileSize)}
                      </td>

                      <td className="py-3 px-3 hidden lg:table-cell text-slate-500 dark:text-slate-400">
                        {formatDate(file.deletedAt || file.updatedAt)}
                      </td>

                      <td className="py-3 pr-4 pl-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => restoreFile(file.fileId)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                            title={t.restore}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t.restore}</span>
                          </button>

                          <button
                            onClick={() => onPermanentDelete(file)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title={t.permanentDelete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t.permanentDelete}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
