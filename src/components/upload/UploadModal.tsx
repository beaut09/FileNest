import React, { useState, useRef } from 'react';
import { UploadCloud, X, File, AlertCircle, CheckCircle, Folder as FolderIcon } from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { formatBytes } from '../../utils/sanitize';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFolderId?: string | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  targetFolderId,
}) => {
  const { uploadFiles, folders } = useFiles();
  const { t } = useThemeLanguage();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentFolder = folders.find((f) => f.folderId === targetFolderId);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    const filesToUpload = [...selectedFiles];
    setSelectedFiles([]);
    onClose();
    await uploadFiles(filesToUpload, targetFolderId);
  };

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-500" />
              {t.uploadFile}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Uploading to:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {currentFolder ? `📁 ${currentFolder.name}` : 'Root / All Files'}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
            isDragging
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/30'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t.dragAndDropText}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supports Images, PDFs, Docs, Sheets, Videos, Audio, ZIP archives & more
          </p>
          <button
            type="button"
            className="mt-4 px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-xl shadow-sm transition"
          >
            {t.selectFiles}
          </button>
        </div>

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>
                Selected {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} (
                {formatBytes(totalSize)})
              </span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-rose-500 hover:text-rose-600"
              >
                Clear all
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs border border-slate-200/60 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <File className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </span>
                    <span className="text-slate-400 shrink-0">({formatBytes(file.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelectedFile(idx);
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer actions */}
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
            onClick={handleStartUpload}
            disabled={selectedFiles.length === 0}
            className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition"
          >
            Start Upload ({selectedFiles.length})
          </button>
        </div>
      </div>
    </div>
  );
};
