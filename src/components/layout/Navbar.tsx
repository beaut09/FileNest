import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Upload,
  Bell,
  Sun,
  Moon,
  Globe,
  LogOut,
  User,
  Settings,
  Shield,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useFiles } from '../../context/FileContext';
import { SupportedLanguage, ActiveNavTab } from '../../types';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenUpload: () => void;
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  onOpenMobileMenu: () => void;
}

const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
];

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenUpload,
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
}) => {
  const { currentUser, userProfile, signOut } = useAuth();
  const { language, setLanguage, theme, setTheme, isDark, t } = useThemeLanguage();
  const { files } = useFiles();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recentUploads = [...files]
    .filter((f) => !f.isDeleted)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3">
      {/* Left mobile menu button & search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value && activeTab !== 'files') {
                setActiveTab('files');
              }
            }}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/70 border border-transparent focus:border-blue-500 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none transition focus:bg-white dark:focus:bg-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">{t.uploadFile}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          title={isDark ? t.themeLight : t.themeDark}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1.5 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-xs font-medium uppercase"
            title={t.languageSettings}
          >
            <Globe className="w-4 h-4" />
            <span className="hidden md:inline">{language}</span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-40 text-xs">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Language
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      setLanguage(opt.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition ${
                      language === opt.code
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{opt.native}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{opt.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Activity Notifications"
          >
            <Bell className="w-4 h-4" />
            {recentUploads.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 z-40 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                <span className="font-semibold text-slate-900 dark:text-white">Recent Activity</span>
                <span className="text-[11px] text-slate-400">{recentUploads.length} recent</span>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {recentUploads.length === 0 ? (
                  <p className="text-center py-4 text-slate-400">No recent activity</p>
                ) : (
                  recentUploads.map((file) => (
                    <div
                      key={file.fileId}
                      className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
                    >
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        Uploaded "{file.fileName}"
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {userProfile?.photoURL || currentUser?.photoURL ? (
              <img
                src={userProfile?.photoURL || currentUser?.photoURL || ''}
                alt={userProfile?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
                {(userProfile?.name || currentUser?.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-40 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                  {userProfile?.name || 'FileNest User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <span>{t.profile}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>{t.settings}</span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

                <button
                  onClick={async () => {
                    setProfileMenuOpen(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.logout}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
