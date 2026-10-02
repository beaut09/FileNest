import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  Star,
  Menu,
  X,
  HardDrive,
  Trash2,
  Share2,
  Clock,
  Settings,
  User,
  Cloud,
} from 'lucide-react';
import { ActiveNavTab } from '../../types';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { Sidebar } from './Sidebar';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  onOpenUpload: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onOpenUpload,
}) => {
  const { t } = useThemeLanguage();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 lg:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onCloseMobile={onClose} />
      </div>

      {/* Bottom Navigation Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-20 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 lg:hidden">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition ${
            activeTab === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition ${
            activeTab === 'files'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          <span>Files</span>
        </button>

        {/* Center Floating-style Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition"
          aria-label="Upload"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition ${
            activeTab === 'favorites'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Star className="w-5 h-5" />
          <span>Favorites</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition ${
            activeTab === 'storage'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <HardDrive className="w-5 h-5" />
          <span>Storage</span>
        </button>
      </div>
    </>
  );
};
