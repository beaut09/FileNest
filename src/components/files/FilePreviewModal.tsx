import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  Star,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  FileText,
  Calendar,
  HardDrive,
  Folder as FolderIcon,
  Tag,
} from 'lucide-react';
import { FileItem, Folder } from '../../types';
import {
  formatBytes,
  formatDate,
  isImageFile,
  isPdfFile,
  isVideoFile,
  isAudioFile,
  isTextFile,
  downloadFile,
} from '../../utils/sanitize';
import { useFiles } from '../../context/FileContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { FileIcon } from './FileIcon';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
  onShare: (file: FileItem) => void;
  folders: Folder[];
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onShare,
  folders,
}) => {
  const { toggleFavorite } = useFiles();
  const { t } = useThemeLanguage();

  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setTextContent(null);

    if (file && isTextFile(file.mimeType, file.fileName)) {
      setTextLoading(true);
      fetch(file.downloadURL)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setTextLoading(false);
        })
        .catch(() => {
          setTextContent('Unable to load text preview.');
          setTextLoading(false);
        });
    }
  }, [file]);

  if (!file) return null;

  const folderName =
    folders.find((f) => f.folderId === file.folderId)?.name || 'Root / Main Directory';

  const handleDownload = async () => {
    setDownloading(true);
    await downloadFile(file.downloadURL, file.fileName);
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <FileIcon mimeType={file.mimeType} fileName={file.fileName} className="w-6 h-6 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                {file.fileName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatBytes(file.fileSize)} • {formatDate(file.updatedAt || file.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => toggleFavorite(file.fileId, file.isFavorite)}
              className={`p-2 rounded-lg transition-colors ${
                file.isFavorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={file.isFavorite ? t.unfavorite : t.favorite}
            >
              <Star className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={() => onShare(file)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={t.share}
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-colors"
              title={t.download}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{downloading ? 'Downloading...' : t.download}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Preview Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-950/80 overflow-auto relative">
            {/* Image Preview */}
            {isImageFile(file.mimeType, file.fileName) && (
              <div className="relative flex flex-col items-center justify-center w-full h-full">
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400 px-1">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                    title="Rotate"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-auto max-w-full max-h-full flex items-center justify-center p-4">
                  <img
                    src={file.downloadURL}
                    alt={file.fileName}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md"
                  />
                </div>
              </div>
            )}

            {/* PDF Preview */}
            {isPdfFile(file.mimeType, file.fileName) && (
              <div className="w-full h-full flex flex-col items-center">
                <iframe
                  src={`${file.downloadURL}#toolbar=1`}
                  title={file.fileName}
                  className="w-full h-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
                />
              </div>
            )}

            {/* Video Preview */}
            {isVideoFile(file.mimeType, file.fileName) && (
              <div className="w-full h-full flex items-center justify-center p-4">
                <video
                  src={file.downloadURL}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[65vh] max-w-full rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 bg-black"
                >
                  Your browser does not support HTML5 video preview.
                </video>
              </div>
            )}

            {/* Audio Preview */}
            {isAudioFile(file.mimeType, file.fileName) && (
              <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 max-w-md w-full">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950/60 rounded-2xl flex items-center justify-center mb-6">
                  <FileIcon mimeType={file.mimeType} fileName={file.fileName} className="w-10 h-10" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-center mb-2 truncate max-w-full">
                  {file.fileName}
                </h4>
                <p className="text-xs text-slate-500 mb-6">{formatBytes(file.fileSize)}</p>
                <audio src={file.downloadURL} controls className="w-full" autoPlay>
                  Your browser does not support HTML5 audio playback.
                </audio>
              </div>
            )}

            {/* Text Preview */}
            {isTextFile(file.mimeType, file.fileName) && (
              <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-mono">
                  Text File Viewer
                </div>
                <div className="flex-1 p-4 overflow-auto font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {textLoading ? 'Loading document text...' : textContent}
                </div>
              </div>
            )}

            {/* Fallback for unsupported formats */}
            {!isImageFile(file.mimeType, file.fileName) &&
              !isPdfFile(file.mimeType, file.fileName) &&
              !isVideoFile(file.mimeType, file.fileName) &&
              !isAudioFile(file.mimeType, file.fileName) &&
              !isTextFile(file.mimeType, file.fileName) && (
                <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
                  <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                    <FileIcon mimeType={file.mimeType} fileName={file.fileName} className="w-10 h-10" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
                    {t.previewUnavailable}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                    You can still download this file and open it on your device.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm shadow-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {t.download}
                  </button>
                </div>
              )}
          </div>

          {/* Details Sidebar */}
          <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 overflow-y-auto space-y-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                File Details
              </h4>
              <dl className="space-y-3.5 text-xs">
                <div>
                  <dt className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <HardDrive className="w-3.5 h-3.5" /> Size
                  </dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatBytes(file.fileSize)} ({file.fileSize.toLocaleString()} bytes)
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <Tag className="w-3.5 h-3.5" /> MIME Type
                  </dt>
                  <dd className="font-mono text-slate-800 dark:text-slate-200 break-words">
                    {file.mimeType || 'application/octet-stream'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <FolderIcon className="w-3.5 h-3.5" /> Folder
                  </dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200">
                    {folderName}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Uploaded
                  </dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDate(file.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <a
                href={file.downloadURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
