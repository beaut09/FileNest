import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Folders,
  Clock,
  Share2,
  Star,
  Trash2,
  HardDrive,
  Settings,
  Cloud,
  ChevronRight,
} from 'lucide-react';
import { ActiveNavTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../context/FileContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { formatBytes } from '../../utils/sanitize';

interface SidebarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onCloseMobile,
}) => {
  const { userProfile } = useAuth();
  const { files, trashFilesCount = 0 } = useFiles() as any;
  const { t } = useThemeLanguage();

  const totalUsed = userProfile?.storageUsed || 0;
  const storageLimit = userProfile?.storageLimit || 10 * 1024 * 1024 * 1024;
  const usagePercent = Math.min(100, Math.round((totalUsed / storageLimit) * 100));

  const navItems: { id: ActiveNavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'files', label: t.myFiles, icon: FolderOpen },
    { id: 'folders', label: t.folders, icon: Folders },
    { id: 'recent', label: t.recentFiles, icon: Clock },
    { id: 'shared', label: t.sharedFiles, icon: Share2 },
    { id: 'favorites', label: t.favorites, icon: Star },
    { id: 'trash', label: t.trash, icon: Trash2 },
    { id: 'storage', label: t.storage, icon: HardDrive },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const handleSelectTab = (tab: ActiveNavTab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 h-full flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Cloud className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              FileNest
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Cloud Storage
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.id === 'trash' && trashFilesCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {trashFilesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Storage usage widget at bottom */}
      <div className="p-4 m-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-blue-500" />
            Storage
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {usagePercent}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              usagePercent > 90
                ? 'bg-rose-500'
                : usagePercent > 70
                ? 'bg-amber-500'
                : 'bg-blue-600'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono mb-2">
          <span>{formatBytes(totalUsed)}</span>
          <span>{formatBytes(storageLimit)}</span>
        </div>

        <button
          onClick={() => handleSelectTab('storage')}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-850 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition"
        >
          <span>Manage Storage</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};
