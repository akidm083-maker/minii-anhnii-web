import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isQuotaExceededError,
  OperationType,
} from '../firebase';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  authLoading: boolean;
  authError: string | null;
  quotaExceeded: boolean;
  markQuotaExceeded: () => void;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

const ADMIN_EMAIL = 'akidm083@gmail.com';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const syncUserRecords = useCallback(async (firebaseUser: User) => {
    if (!firebaseUser.emailVerified) return;

    const uid = firebaseUser.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
    if (!uid) return;

    const displayName = (firebaseUser.displayName || 'Хэрэглэгч').trim().slice(0, 60) || 'Хэрэглэгч';
    const photoURL = (firebaseUser.photoURL || '').trim().slice(0, 500);
    const email = (firebaseUser.email || '').trim().slice(0, 160);

    const publicPath = `users/${uid}/public/profile`;
    try {
      const publicRef = doc(db, 'users', uid, 'public', 'profile');
      const existingPublicSnap = await getDoc(publicRef);
      if (existingPublicSnap.exists()) {
        const updatePayload: Record<string, unknown> = {
          displayName,
          updatedAt: serverTimestamp(),
        };
        if (photoURL) {
          updatePayload.photoURL = photoURL;
        }
        await updateDoc(publicRef, updatePayload);
      } else {
        const createPayload: Record<string, unknown> = {
          uid,
          displayName,
          updatedAt: serverTimestamp(),
        };
        if (photoURL) {
          createPayload.photoURL = photoURL;
        }
        await setDoc(publicRef, createPayload);
      }
    } catch (error) {
      if (isQuotaExceededError(error)) {
        setQuotaExceeded(true);
        return;
      }
      handleFirestoreError(error, OperationType.WRITE, publicPath);
    }

    if (email) {
      const privatePath = `users/${uid}/private/info`;
      try {
        const privateRef = doc(db, 'users', uid, 'private', 'info');
        const existingSnap = await getDoc(privateRef);
        if (!existingSnap.exists()) {
          await setDoc(privateRef, {
            uid,
            email,
            createdAt: serverTimestamp(),
          });
        }
      } catch (error) {
        if (isQuotaExceededError(error)) {
          setQuotaExceeded(true);
          return;
        }
        handleFirestoreError(error, OperationType.WRITE, privatePath);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) {
        syncUserRecords(currentUser).catch((err) => {
          console.error('Failed to sync user profile:', err);
        });
      }
    });
    return () => unsubscribe();
  }, [syncUserRecords]);

  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes('popup-closed-by-user') && !msg.includes('cancelled-popup-request')) {
        setAuthError('Google-ээр нэвтрэх үед алдаа гарлаа. Дахин оролдоно уу.');
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signOut(auth);
    } catch {
      setAuthError('Гарах үед алдаа гарлаа.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const isAdmin = Boolean(
    user && user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL
  );

  const value: FirebaseContextValue = {
    user,
    authReady,
    isAdmin,
    authLoading,
    authError,
    quotaExceeded,
    markQuotaExceeded: () => setQuotaExceeded(true),
    clearAuthError: () => setAuthError(null),
    signInWithGoogle,
    signOutUser,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return ctx;
}
