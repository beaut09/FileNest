import { FileCategory } from '../types';

/**
 * Strips out all keys with undefined values recursively so Firestore never throws
 * "Unsupported field value: undefined"
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeFirestoreData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getFileCategory(mimeType: string = '', fileName: string = ''): FileCategory {
  const lowerMime = mimeType.toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (
    lowerMime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic'].includes(ext)
  ) {
    return 'images';
  }

  if (
    lowerMime.startsWith('video/') ||
    ['mp4', 'webm', 'mkv', 'mov', 'avi', 'flv'].includes(ext)
  ) {
    return 'videos';
  }

  if (
    lowerMime.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)
  ) {
    return 'audio';
  }

  if (
    lowerMime.includes('zip') ||
    lowerMime.includes('tar') ||
    lowerMime.includes('rar') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
  ) {
    return 'archives';
  }

  if (
    lowerMime.includes('pdf') ||
    lowerMime.includes('word') ||
    lowerMime.includes('excel') ||
    lowerMime.includes('sheet') ||
    lowerMime.includes('presentation') ||
    lowerMime.includes('powerpoint') ||
    lowerMime.includes('text/') ||
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md', 'rtf'].includes(ext)
  ) {
    return 'documents';
  }

  return 'other';
}

export function isImageFile(mimeType: string, fileName: string): boolean {
  return getFileCategory(mimeType, fileName) === 'images';
}

export function isPdfFile(mimeType: string, fileName: string): boolean {
  return (
    mimeType.toLowerCase().includes('pdf') ||
    fileName.toLowerCase().endsWith('.pdf')
  );
}

export function isVideoFile(mimeType: string, fileName: string): boolean {
  return getFileCategory(mimeType, fileName) === 'videos';
}

export function isAudioFile(mimeType: string, fileName: string): boolean {
  return getFileCategory(mimeType, fileName) === 'audio';
}

export function isTextFile(mimeType: string, fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return (
    mimeType.startsWith('text/') ||
    ['txt', 'csv', 'json', 'md', 'html', 'js', 'ts', 'css', 'xml', 'log'].includes(ext)
  );
}

/**
 * Triggers a real, secure browser download for a Firebase storage URL
 * preserving the original file name where possible.
 */
export async function downloadFile(url: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.warn('Direct blob download failed, falling back to direct window open/download link', error);
    // Fallback if CORS or network blocks blob fetch
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
