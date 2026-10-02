import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Palette,
  Globe,
  Sun,
  Moon,
  Monitor,
  Key,
  Mail,
  CheckCircle,
  HelpCircle,
  Database,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { firebaseConfig } from '../../firebase/config';
import { SupportedLanguage, ThemeMode } from '../../types';

const LANGUAGES: { code: SupportedLanguage; name: string; native: string; flag: string }[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
];

export const SettingsView: React.FC = () => {
  const { currentUser, resetPassword } = useAuth();
  const { language, setLanguage, theme, setTheme, t } = useThemeLanguage();

  const [activeSection, setActiveSection] = useState<
    'appearance' | 'language' | 'security' | 'admin'
  >('appearance');

  const [sendingReset, setSendingReset] = useState(false);

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    setSendingReset(true);
    try {
      await resetPassword(currentUser.email);
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500" />
          {t.settings}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure application appearance, language preferences, and security
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('appearance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeSection === 'appearance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>{t.appearanceSettings}</span>
        </button>

        <button
          onClick={() => setActiveSection('language')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeSection === 'language'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{t.languageSettings}</span>
        </button>

        <button
          onClick={() => setActiveSection('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeSection === 'security'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{t.securitySettings}</span>
        </button>

        <button
          onClick={() => setActiveSection('admin')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            activeSection === 'admin'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>System & Architecture</span>
        </button>
      </div>

      {/* APPEARANCE SECTION */}
      {activeSection === 'appearance' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Interface Theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize how FileNest looks on your device
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 font-semibold ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mb-3">
                <Sun className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold">{t.themeLight}</span>
              <span className="text-[11px] text-slate-400 mt-1">Crisp and clean day style</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-blue-400 flex items-center justify-center mb-3">
                <Moon className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold">{t.themeDark}</span>
              <span className="text-[11px] text-slate-400 mt-1">Easy on your eyes in low light</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition ${
                theme === 'system'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mb-3">
                <Monitor className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold">{t.themeSystem}</span>
              <span className="text-[11px] text-slate-400 mt-1">Sync with OS device preference</span>
            </button>
          </div>
        </div>
      )}

      {/* LANGUAGE SECTION */}
      {activeSection === 'language' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Language & Regional Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select your preferred language. Includes automatic RTL orientation for Arabic.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-between p-4 rounded-2xl border text-left transition ${
                  language === lang.code
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {lang.native}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{lang.name}</p>
                  </div>
                </div>
                {language === lang.code && (
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SECURITY SECTION */}
      {activeSection === 'security' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Account Security & Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your authentication credentials and account protection
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-500" /> Password Reset
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Send a password reset email to your registered email address ({currentUser?.email}).
                </p>
              </div>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={sendingReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shrink-0 disabled:opacity-50"
              >
                {sendingReset ? 'Sending...' : t.sendPasswordReset}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ARCHITECTURE SECTION */}
      {activeSection === 'admin' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" /> Architecture & Firebase Storage Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Overview of the connected cloud infrastructure (Requirement 30)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Firebase Backend</p>
              <dl className="space-y-1.5 text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Project ID:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{firebaseConfig.projectId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Firestore Rules:</span>
                  <span className="text-emerald-600 font-semibold">Active & Hardened</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage Engine:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">Google Cloud Storage</span>
                </div>
              </dl>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Security Architecture</p>
              <ul className="space-y-1 text-slate-500 dark:text-slate-400">
                <li>• User isolation via <code>users/&#123;uid&#125;/files/&#123;fileId&#125;</code></li>
                <li>• Granular link sharing with <code>shares/&#123;shareId&#125;</code></li>
                <li>• No undefined values allowed to Firestore</li>
                <li>• Role-based access ready for future admin expansions</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
