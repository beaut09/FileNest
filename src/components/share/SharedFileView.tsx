import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import {
  Download,
  Share2,
  AlertCircle,
  FileText,
  Calendar,
  HardDrive,
  Cloud,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { db } from '../../firebase/config';
import { ShareItem } from '../../types';
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
import { FileIcon } from '../files/FileIcon';

interface SharedFileViewProps {
  shareId: string;
  onGoToApp: () => void;
}

export const SharedFileView: React.FC<SharedFileViewProps> = ({ shareId, onGoToApp }) => {
  const [shareData, setShareData] = useState<ShareItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    async function loadSharedFile() {
      setLoading(true);
      try {
        const shareDocRef = doc(db, 'shares', shareId);
        const snap = await getDoc(shareDocRef);

        if (!snap.exists()) {
          setError('This shared file does not exist or has been removed.');
          setLoading(false);
          return;
        }

        const data = snap.data() as ShareItem;
        if (!data.enabled) {
          setError('This share link has been disabled by the owner.');
          setLoading(false);
          return;
        }

        setShareData(data);

        if (isTextFile(data.mimeType, data.fileName)) {
          fetch(data.downloadURL)
            .then((r) => r.text())
            .then((txt) => setTextContent(txt))
            .catch(() => setTextContent('Text content could not be loaded.'));
        }
      } catch (err: any) {
        console.error('Failed to load shared file:', err);
        setError('Unable to load shared file. Please check the link or try again.');
      } finally {
        setLoading(false);
      }
    }

    if (shareId) {
      loadSharedFile();
    }
  }, [shareId]);

  const handleDownload = async () => {
    if (!shareData) return;
    setDownloading(true);
    await downloadFile(shareData.downloadURL, shareData.fileName);
    setDownloading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGoToApp}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Cloud className="w-5 h-5 fill-current" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
            FileNest
          </span>
        </div>

        <button
          onClick={onGoToApp}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition"
        >
          Open FileNest
        </button>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 max-w-5xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Retrieving shared file...
            </p>
          </div>
        ) : error || !shareData ? (
          <div className="p-8 max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Link Inactive
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
              {error || 'This file link is invalid or has expired.'}
            </p>
            <button
              onClick={onGoToApp}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              Go to FileNest Home
            </button>
          </div>
        ) : (
          /* File Preview and Download Card */
          <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Header info */}
            <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-3 min-w-0">
                <FileIcon
                  mimeType={shareData.mimeType}
                  fileName={shareData.fileName}
                  className="w-8 h-8 shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                    {shareData.fileName}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>{formatBytes(shareData.fileSize)}</span>
                    <span>•</span>
                    <span>Shared {formatDate(shareData.createdAt)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Downloading...' : 'Download File'}</span>
              </button>
            </div>

            {/* Preview Section */}
            <div className="p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/70 flex items-center justify-center min-h-[350px] max-h-[600px] overflow-auto relative">
              {/* Image Preview */}
              {isImageFile(shareData.mimeType, shareData.fileName) && (
                <div className="relative flex flex-col items-center justify-center w-full">
                  <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button
                      onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono px-1">{Math.round(zoom * 100)}%</span>
                    <button
                      onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                  <img
                    src={shareData.downloadURL}
                    alt={shareData.fileName}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="max-h-[500px] max-w-full object-contain rounded-xl shadow-md"
                  />
                </div>
              )}

              {/* PDF Preview */}
              {isPdfFile(shareData.mimeType, shareData.fileName) && (
                <iframe
                  src={`${shareData.downloadURL}#toolbar=1`}
                  title={shareData.fileName}
                  className="w-full h-[500px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                />
              )}

              {/* Video Preview */}
              {isVideoFile(shareData.mimeType, shareData.fileName) && (
                <video
                  src={shareData.downloadURL}
                  controls
                  className="max-h-[500px] max-w-full rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 bg-black"
                >
                  Your browser does not support HTML5 video preview.
                </video>
              )}

              {/* Audio Preview */}
              {isAudioFile(shareData.mimeType, shareData.fileName) && (
                <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 max-w-md w-full text-center">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileIcon
                      mimeType={shareData.mimeType}
                      fileName={shareData.fileName}
                      className="w-8 h-8"
                    />
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                    {shareData.fileName}
                  </h4>
                  <audio src={shareData.downloadURL} controls className="w-full">
                    Your browser does not support audio preview.
                  </audio>
                </div>
              )}

              {/* Text Preview */}
              {isTextFile(shareData.mimeType, shareData.fileName) && (
                <div className="w-full h-[450px] p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-auto font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {textContent || 'Loading preview...'}
                </div>
              )}

              {/* Unsupported fallback */}
              {!isImageFile(shareData.mimeType, shareData.fileName) &&
                !isPdfFile(shareData.mimeType, shareData.fileName) &&
                !isVideoFile(shareData.mimeType, shareData.fileName) &&
                !isAudioFile(shareData.mimeType, shareData.fileName) &&
                !isTextFile(shareData.mimeType, shareData.fileName) && (
                  <div className="text-center p-8 max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
                      <FileIcon
                        mimeType={shareData.mimeType}
                        fileName={shareData.fileName}
                        className="w-8 h-8"
                      />
                    </div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                      Preview not available
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
                      Click download to save and open this file on your device.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
                    >
                      Download ({formatBytes(shareData.fileSize)})
                    </button>
                  </div>
                )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400">
        Shared safely with <span className="font-semibold text-blue-600 dark:text-blue-400">FileNest</span> Cloud Storage
      </footer>
    </div>
  );
};
