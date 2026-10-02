import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  Folder as FolderIcon,
  ChevronRight,
  UploadCloud,
  FolderPlus,
  ArrowLeft,
  Search,
  X,
} from 'lucide-react';
import { useFiles } from '../../context/FileContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import {
  FileItem,
  Folder,
  ViewMode,
  SortField,
  SortDirection,
  FileCategory,
} from '../../types';
import { getFileCategory, formatBytes } from '../../utils/sanitize';
import { FileCard } from './FileCard';
import { FileRow } from './FileRow';

interface FileManagerViewProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenUpload: () => void;
  onOpenCreateFolder: () => void;
  onPreviewFile: (file: FileItem) => void;
  onRenameFile: (file: FileItem) => void;
  onMoveFile: (file: FileItem) => void;
  onShareFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
  filterMode?: 'all' | 'favorites' | 'shared' | 'recent';
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenUpload,
  onOpenCreateFolder,
  onPreviewFile,
  onRenameFile,
  onMoveFile,
  onShareFile,
  onDeleteFile,
  filterMode = 'all',
}) => {
  const { files, folders, activeFolderId, setActiveFolderId } = useFiles();
  const { t } = useThemeLanguage();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const activeFolder = folders.find((f) => f.folderId === activeFolderId);

  // Filter logic
  const filteredFiles = useMemo(() => {
    let result = files.filter((f) => !f.isDeleted);

    // Filter mode tabs
    if (filterMode === 'favorites') {
      result = result.filter((f) => f.isFavorite);
    } else if (filterMode === 'shared') {
      result = result.filter((f) => f.shared);
    } else if (filterMode === 'recent') {
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      // In standard file manager, respect active folder unless searching
      if (!searchQuery) {
        if (activeFolderId) {
          result = result.filter((f) => f.folderId === activeFolderId);
        } else {
          result = result.filter((f) => !f.folderId);
        }
      }
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(
        (f) => getFileCategory(f.mimeType, f.fileName) === selectedCategory
      );
    }

    // Global Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((f) => {
        const nameMatch = f.fileName.toLowerCase().includes(q);
        const mimeMatch = f.mimeType.toLowerCase().includes(q);
        const folder = folders.find((fol) => fol.folderId === f.folderId);
        const folderMatch = folder ? folder.name.toLowerCase().includes(q) : false;
        return nameMatch || mimeMatch || folderMatch;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.fileName.localeCompare(b.fileName);
      } else if (sortField === 'size') {
        comparison = a.fileSize - b.fileSize;
      } else if (sortField === 'type') {
        comparison = a.mimeType.localeCompare(b.mimeType);
      } else {
        // date
        comparison =
          new Date(a.updatedAt || a.createdAt).getTime() -
          new Date(b.updatedAt || b.createdAt).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [
    files,
    filterMode,
    activeFolderId,
    selectedCategory,
    searchQuery,
    sortField,
    sortDirection,
    folders,
  ]);

  const totalFilteredSize = filteredFiles.reduce((acc, f) => acc + f.fileSize, 0);

  const categories: { id: FileCategory; label: string }[] = [
    { id: 'all', label: t.allCategories },
    { id: 'images', label: t.images },
    { id: 'documents', label: t.documents },
    { id: 'videos', label: t.videos },
    { id: 'audio', label: t.audio },
    { id: 'archives', label: t.archives },
    { id: 'other', label: t.other },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb path */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <button
              onClick={() => setActiveFolderId(null)}
              className={`hover:text-blue-600 dark:hover:text-blue-400 font-medium ${
                !activeFolderId ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              {filterMode === 'favorites'
                ? t.favorites
                : filterMode === 'shared'
                ? t.sharedFiles
                : filterMode === 'recent'
                ? t.recentFiles
                : t.myFiles}
            </button>

            {activeFolder && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 dark:text-white font-semibold flex items-center gap-1">
                  <FolderIcon className="w-3.5 h-3.5 text-blue-500" />
                  {activeFolder.name}
                </span>
              </>
            )}
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {activeFolder
              ? activeFolder.name
              : filterMode === 'favorites'
              ? t.favorites
              : filterMode === 'shared'
              ? t.sharedFiles
              : filterMode === 'recent'
              ? t.recentFiles
              : t.myFiles}
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} •{' '}
            {formatBytes(totalFilteredSize)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {activeFolderId && (
            <button
              onClick={() => setActiveFolderId(null)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Root</span>
            </button>
          )}

          <button
            onClick={onOpenCreateFolder}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl shadow-xs transition"
          >
            <FolderPlus className="w-4 h-4 text-blue-500" />
            <span>{t.newFolder}</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-sm transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t.uploadFile}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Controls Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View Mode & Sorting Controls */}
        <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-700 dark:text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-transparent outline-none cursor-pointer pr-1"
            >
              <option value="date" className="dark:bg-slate-800">
                {t.sortByDate}
              </option>
              <option value="name" className="dark:bg-slate-800">
                {t.sortByName}
              </option>
              <option value="size" className="dark:bg-slate-800">
                {t.sortBySize}
              </option>
              <option value="type" className="dark:bg-slate-800">
                {t.sortByType}
              </option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase"
              title="Toggle Sort Order"
            >
              {sortDirection}
            </button>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={t.gridView}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={t.listView}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search results banner if searching */}
      {searchQuery && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200">
          <span>
            Search results for <span className="font-semibold">"{searchQuery}"</span>: {filteredFiles.length} file(s) found
          </span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
          >
            <X className="w-3.5 h-3.5" /> Clear search
          </button>
        </div>
      )}

      {/* Main Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {searchQuery
              ? t.noSearchResults
              : filterMode === 'favorites'
              ? t.noFavoritesYet
              : filterMode === 'shared'
              ? t.noSharedYet
              : t.noFilesYet}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery
              ? t.noSearchResultsDesc
              : filterMode === 'favorites'
              ? t.noFavoritesDesc
              : filterMode === 'shared'
              ? t.noSharedDesc
              : t.noFilesDesc}
          </p>
          {!searchQuery && (
            <button
              onClick={onOpenUpload}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              {t.uploadFile}
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.fileId}
              file={file}
              folders={folders}
              onPreview={onPreviewFile}
              onRename={onRenameFile}
              onMove={onMoveFile}
              onShare={onShareFile}
              onDelete={onDeleteFile}
            />
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="w-8 py-3 pl-4 pr-1"></th>
                  <th className="py-3 px-3">{t.name}</th>
                  <th className="py-3 px-3 hidden md:table-cell">{t.folder}</th>
                  <th className="py-3 px-3 hidden sm:table-cell">{t.size}</th>
                  <th className="py-3 px-3 hidden lg:table-cell">{t.modified}</th>
                  <th className="py-3 pr-4 pl-2 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <FileRow
                    key={file.fileId}
                    file={file}
                    folders={folders}
                    onPreview={onPreviewFile}
                    onRename={onRenameFile}
                    onMove={onMoveFile}
                    onShare={onShareFile}
                    onDelete={onDeleteFile}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
