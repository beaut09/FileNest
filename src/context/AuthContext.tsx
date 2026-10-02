import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../firebase/config';
import { handleFirestoreError, OperationType, getFriendlyErrorMessage } from '../firebase/errors';
import { sanitizeFirestoreData } from '../utils/sanitize';
import { UserProfile } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyCurrentEmail: () => Promise<void>;
  updateUserProfileData: (name: string, photoURL?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_STORAGE_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const syncUserProfileDoc = useCallback(async (user: FirebaseUser) => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
          storageUsed: 0,
          storageLimit: DEFAULT_STORAGE_LIMIT,
        };
        await setDoc(userDocRef, sanitizeFirestoreData(newProfile));
        setUserProfile(newProfile);
      } else {
        setUserProfile(snap.data() as UserProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfileDoc(user);
        // Subscribe to realtime profile updates (such as storageUsed)
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          }
        );
      } else {
        setUserProfile(null);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = undefined;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [syncUserProfileDoc]);

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await syncUserProfileDoc(res.user);
      showToast('success', 'Welcome to FileNest', `Signed in as ${res.user.displayName || res.user.email}`);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      showToast('error', 'Sign In Failed', getFriendlyErrorMessage(err));
      throw err;
    }
  };

  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        await firebaseUpdateProfile(res.user, { displayName: name.trim() });
      }
      await syncUserProfileDoc(res.user);
      showToast('success', 'Account Created', `Welcome to FileNest, ${name.trim()}!`);
    } catch (err: any) {
      console.error('Email Sign-up failed:', err);
      showToast('error', 'Registration Failed', getFriendlyErrorMessage(err));
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await syncUserProfileDoc(res.user);
      showToast('success', 'Welcome Back', `Logged in as ${res.user.displayName || res.user.email}`);
    } catch (err: any) {
      console.error('Email Sign-in failed:', err);
      showToast('error', 'Login Failed', getFriendlyErrorMessage(err));
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      showToast('info', 'Logged Out', 'You have been signed out successfully.');
    } catch (err: any) {
      console.error('Sign out error:', err);
      showToast('error', 'Logout Error', getFriendlyErrorMessage(err));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showToast('success', 'Reset Email Sent', `Password reset instructions sent to ${email}`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      showToast('error', 'Reset Failed', getFriendlyErrorMessage(err));
      throw err;
    }
  };

  const verifyCurrentEmail = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      showToast('success', 'Verification Sent', 'Check your inbox for the verification email.');
    } catch (err: any) {
      console.error('Email verification error:', err);
      showToast('error', 'Verification Failed', getFriendlyErrorMessage(err));
      throw err;
    }
  };

  const updateUserProfileData = async (name: string, photoURL?: string) => {
    if (!auth.currentUser) return;
    try {
      await firebaseUpdateProfile(auth.currentUser, {
        displayName: name,
        photoURL: photoURL || undefined,
      });

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const updatePayload = sanitizeFirestoreData({
        name,
        photoURL: photoURL || '',
      });
      await updateDoc(userDocRef, updatePayload);

      setUserProfile((prev) => (prev ? { ...prev, name, photoURL: photoURL || '' } : null));
      showToast('success', 'Profile Updated', 'Your profile details have been saved.');
    } catch (err: any) {
      console.error('Profile update error:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        signOut,
        resetPassword,
        verifyCurrentEmail,
        updateUserProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
