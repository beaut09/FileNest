import React from 'react';
import { Cloud, AlertTriangle, Key, CheckCircle, Shield } from 'lucide-react';
import { missingConfigFields } from '../../firebase/config';

export const FirebaseSetupBanner: React.FC = () => {
  const allRequired = [
    { key: 'apiKey', env: 'VITE_FIREBASE_API_KEY', desc: 'Firebase Web API Key' },
    { key: 'authDomain', env: 'VITE_FIREBASE_AUTH_DOMAIN', desc: 'Firebase Authentication Domain' },
    { key: 'projectId', env: 'VITE_FIREBASE_PROJECT_ID', desc: 'Firebase Project ID' },
    { key: 'storageBucket', env: 'VITE_FIREBASE_STORAGE_BUCKET', desc: 'Firebase Storage Bucket URL' },
    { key: 'messagingSenderId', env: 'VITE_FIREBASE_MESSAGING_SENDER_ID', desc: 'Firebase Cloud Messaging Sender ID' },
    { key: 'appId', env: 'VITE_FIREBASE_APP_ID', desc: 'Firebase Web Application ID' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Firebase Configuration Required</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Connect your Firebase Web App configuration to activate FileNest
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Please add your Firebase Web App configuration into either your environment variables (<code>.env</code>) or <code>firebase-applet-config.json</code>.
        </div>

        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Required Configuration Fields:
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {allRequired.map((field) => {
              const isMissing = missingConfigFields.includes(field.key as any);
              return (
                <div
                  key={field.key}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                    isMissing
                      ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200'
                      : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 opacity-70" />
                    <div>
                      <span className="font-semibold font-mono">{field.key}</span>
                      <span className="text-[10px] opacity-75 ml-2">({field.desc})</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white/60 dark:bg-slate-800/60">
                    {field.env}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Security: Client credentials only. Never expose Admin SDK keys.</span>
          <Shield className="w-4 h-4 text-emerald-500" />
        </div>
      </div>
    </div>
  );
};
