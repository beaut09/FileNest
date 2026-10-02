import { auth, isFirebaseConfigured } from './config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuthUser = isFirebaseConfigured ? auth?.currentUser : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuthUser?.uid,
      email: currentAuthUser?.email,
      emailVerified: currentAuthUser?.emailVerified,
      isAnonymous: currentAuthUser?.isAnonymous,
      tenantId: currentAuthUser?.tenantId,
      providerInfo: currentAuthUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getFriendlyErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const msg = err instanceof Error ? err.message : String(err);

  // Exact mappings from specification
  if (
    msg.includes('auth/invalid-credential') ||
    msg.includes('auth/wrong-password')
  ) {
    return 'Email or password is incorrect.';
  }
  if (msg.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists.';
  }
  if (msg.includes('auth/user-not-found')) {
    return 'No account was found with this email.';
  }
  if (msg.includes('storage/unauthorized')) {
    return "You don't have permission to access or upload this file. Check your Firebase Storage rules.";
  }
  if (msg.includes('storage/object-not-found')) {
    return 'This file could not be found.';
  }
  if (
    msg.includes('storage/unknown') ||
    msg.includes('storage/retry-limit-exceeded') ||
    msg.includes('Failed to fetch') ||
    msg.toLowerCase().includes('cors')
  ) {
    return 'Upload failed due to CORS or network error. Please ensure Firebase Storage CORS is configured for your domain.';
  }
  if (
    msg.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions')
  ) {
    return "You don't have permission to perform this action.";
  }
  if (msg.includes('auth/weak-password')) {
    return 'Password should be at least 6 characters long.';
  }
  if (msg.includes('auth/popup-closed-by-user')) {
    return 'Sign-in popup was closed before completing. Please try again.';
  }
  if (msg.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is not enabled. Please sign in using Google.';
  }
  if (msg.includes('storage/quota-exceeded')) {
    return 'Storage quota exceeded. Please delete some files or upgrade your plan.';
  }
  if (msg.includes('storage/canceled')) {
    return 'Upload was canceled.';
  }
  if (
    msg.includes('the client is offline') ||
    msg.includes('network-request-failed')
  ) {
    return 'Network connection issue. Please check your internet connection.';
  }

  return 'Operation failed. Please try again.';
}
