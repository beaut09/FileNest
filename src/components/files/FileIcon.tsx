import React from 'react';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  File as FileGeneric,
} from 'lucide-react';
import { getFileCategory } from '../../utils/sanitize';

interface FileIconProps {
  mimeType: string;
  fileName: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ mimeType, fileName, className = 'w-6 h-6' }) => {
  const category = getFileCategory(mimeType, fileName);
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (category === 'images') {
    return <FileImage className={`${className} text-rose-500`} />;
  }

  if (category === 'videos') {
    return <FileVideo className={`${className} text-purple-500`} />;
  }

  if (category === 'audio') {
    return <FileAudio className={`${className} text-amber-500`} />;
  }

  if (category === 'archives') {
    return <FileArchive className={`${className} text-yellow-600 dark:text-yellow-400`} />;
  }

  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || mimeType.includes('sheet') || mimeType.includes('excel')) {
    return <FileSpreadsheet className={`${className} text-emerald-600`} />;
  }

  if (['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php'].includes(ext)) {
    return <FileCode className={`${className} text-cyan-500`} />;
  }

  if (category === 'documents') {
    return <FileText className={`${className} text-blue-500`} />;
  }

  return <FileGeneric className={`${className} text-slate-400`} />;
};
