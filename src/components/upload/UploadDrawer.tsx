import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  RotateCcw,
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { formatBytes } from '../../utils/sanitize';

export const UploadDrawer: React.FC = () => {
  const { uploadQueue, cancelUpload, clearCompletedUploads } = useFiles();
  const { t } = useThemeLanguage();
  const [minimized, setMinimized] = useState<boolean>(false);

  if (uploadQueue.length === 0) return null;

  const inProgressCount = uploadQueue.filter((u) => u.status === 'uploading').length;
  const completedCount = uploadQueue.filter((u) => u.status === 'completed').length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white cursor-pointer select-none">
        <div
          className="flex items-center gap-2 flex-1"
          onClick={() => setMinimized(!minimized)}
        >
          <UploadCloud className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-xs font-semibold">
            {inProgressCount > 0
              ? `Uploading ${inProgressCount} file${inProgressCount > 1 ? 's' : ''}...`
              : `${completedCount} of ${uploadQueue.length} files uploaded`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
          >
            {minimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={clearCompletedUploads}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title={t.clearCompleted}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task list */}
      {!minimized && (
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-2">
          {uploadQueue.map((item) => (
            <div key={item.id} className="pt-2 first:pt-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[190px] sm:max-w-[230px]">
                  {item.name}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {formatBytes(item.size)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    item.status === 'completed'
                      ? 'bg-emerald-500'
                      : item.status === 'error'
                      ? 'bg-rose-500'
                      : item.status === 'canceled'
                      ? 'bg-slate-400'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between mt-1 text-[11px]">
                {item.status === 'uploading' && (
                  <>
                    <span className="text-blue-500 font-medium">{item.progress}%</span>
                    <button
                      onClick={() => cancelUpload(item.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      {t.cancel}
                    </button>
                  </>
                )}
                {item.status === 'completed' && (
                  <span className="text-emerald-500 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                )}
                {item.status === 'error' && (
                  <span className="text-rose-500 flex items-center gap-1 truncate" title={item.error}>
                    <AlertCircle className="w-3 h-3 shrink-0" /> {item.error || 'Failed'}
                  </span>
                )}
                {item.status === 'canceled' && (
                  <span className="text-slate-400 italic">Canceled</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
