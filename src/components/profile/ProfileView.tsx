import React, { useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  HardDrive,
  FileText,
  CheckCircle,
  AlertCircle,
  Save,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../context/FileContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { formatBytes, formatDate } from '../../utils/sanitize';

export const ProfileView: React.FC = () => {
  const { currentUser, userProfile, updateUserProfileData, verifyCurrentEmail } = useAuth();
  const { files } = useFiles();
  const { t } = useThemeLanguage();

  const [name, setName] = useState<string>(
    userProfile?.name || currentUser?.displayName || ''
  );
  const [photoURL, setPhotoURL] = useState<string>(
    userProfile?.photoURL || currentUser?.photoURL || ''
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);

  const activeFiles = files.filter((f) => !f.isDeleted);
  const totalUsed = userProfile?.storageUsed || 0;
  const storageLimit = userProfile?.storageLimit || 10 * 1024 * 1024 * 1024;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await updateUserProfileData(name.trim(), photoURL.trim() || undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifying(true);
    try {
      await verifyCurrentEmail();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-blue-500" />
          {t.profile}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your account profile, avatar, credentials, and cloud vault stats
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card with Stats */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            {photoURL ? (
              <img
                src={photoURL}
                alt={name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-3xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                {(name || currentUser?.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{name || 'User'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 break-all">{currentUser?.email}</p>
          </div>

          {/* Quick Stats Pill */}
          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-left text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <FileText className="w-3.5 h-3.5" /> Total Files
              </span>
              <span className="font-semibold">{activeFiles.length}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <HardDrive className="w-3.5 h-3.5" /> Used Storage
              </span>
              <span className="font-semibold font-mono">{formatBytes(totalUsed)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5" /> {t.memberSince}
              </span>
              <span className="font-medium text-[11px]">
                {formatDate(userProfile?.createdAt || currentUser?.metadata?.creationTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.fullName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.profilePhoto}
              </label>
              <input
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Direct image link URL for your account avatar.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.emailAddress}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 text-sm outline-none cursor-not-allowed"
                />
                {currentUser?.emailVerified ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-2 rounded-xl shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={verifying}
                    className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-2.5 py-2 rounded-xl shrink-0 transition"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{verifying ? 'Sending...' : t.verifyEmail}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : t.save}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
