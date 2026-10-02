import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey || "AIzaSyDGyHvo1H7lzDlcMFWC-_CttZqLZsDKl3M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain || "filenest-c333d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || "filenest-c333d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || "filenest-c333d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId || "294898822121",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId || "1:294898822121:web:d1f62379231583b76f3978",
  measurementId: firebaseConfigData.measurementId || "G-Z0ZL3BJB6N",
};

// Singleton-style Firebase initialization (initialize only once)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Google Analytics initialization (client-side only with support check)
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn('Google Analytics could not be initialized:', e);
      }
    }
  }).catch(() => {});
}

// Authentication, Firestore, and Storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const missingConfigFields = (
  ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const
).filter((key) => !firebaseConfig[key]);

// Test Firestore connection on boot
if (typeof window !== 'undefined' && db) {
  (async function testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error('Please check your Firebase connection or internet configuration.');
      }
    }
  })();
}
