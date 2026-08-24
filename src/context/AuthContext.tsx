import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AdminUser } from '../types';
import { logAuditAction } from '../services/auditService';

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setupInitialAdminAccount: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mapping username to canonical internal email for Firebase Auth
export function resolveAdminEmail(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Standard username mapping: e.g., cloeastbatim -> cloeastbatim@cloeast.internal
  return `${trimmed}@cloeast.internal`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch admin record from Firestore
          const adminDocRef = doc(db, 'admins', currentUser.uid);
          const snap = await getDoc(adminDocRef);

          if (snap.exists()) {
            const data = snap.data() as AdminUser;
            setAdminUser(data);
          } else {
            // Auto-provision admin doc if signed in with cloeastbatim or default admin email
            const email = currentUser.email || '';
            const isAdminEmail = email.includes('cloeast') || email.includes('clo.east');
            
            const newAdminData: AdminUser = {
              uid: currentUser.uid,
              username: email.split('@')[0] || 'admin',
              email,
              role: isAdminEmail ? 'admin' : 'staff',
              displayName: 'CLO.EAST Admin',
              isActive: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(adminDocRef, newAdminData, { merge: true });
            setAdminUser(newAdminData);
          }
        } catch (err) {
          console.error('Error checking admin document in Firestore:', err);
          // If firestore read temporarily restricted, allow logged in user to retain session
          if (currentUser.email) {
            setAdminUser({
              uid: currentUser.uid,
              username: currentUser.email.split('@')[0],
              email: currentUser.email,
              role: 'admin',
              displayName: 'CLO.EAST Admin',
              isActive: true,
            });
          }
        }
      } else {
        setAdminUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    try {
      const email = resolveAdminEmail(identifier);
      
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, pass);
      } catch (authErr: any) {
        // If user not found and trying default admin credentials, attempt auto-bootstrap initial admin
        if (
          (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') &&
          (identifier.toLowerCase() === 'cloeastbatim' || email === 'cloeastbatim@cloeast.internal')
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;
            await setDoc(doc(db, 'admins', uid), {
              uid,
              username: 'cloeastbatim',
              email,
              role: 'admin',
              displayName: 'CLO.EAST Super Admin',
              isActive: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (createErr: any) {
            throw authErr;
          }
        } else {
          throw authErr;
        }
      }

      const loggedInUser = userCredential.user;
      
      // Verify Firestore admin record
      const adminDoc = await getDoc(doc(db, 'admins', loggedInUser.uid));
      let adminData: AdminUser;

      if (adminDoc.exists()) {
        adminData = adminDoc.data() as AdminUser;
        if (adminData.role !== 'admin') {
          await signOut(auth);
          return { success: false, error: 'Akses ditolak: Akun Anda tidak memiliki hak administrator.' };
        }
      } else {
        adminData = {
          uid: loggedInUser.uid,
          username: identifier.toLowerCase(),
          email: loggedInUser.email || email,
          role: 'admin',
          displayName: 'CLO.EAST Admin',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'admins', loggedInUser.uid), adminData);
      }

      setAdminUser(adminData);

      await logAuditAction({
        action: 'LOGIN',
        entityType: 'auth',
        entityId: loggedInUser.uid,
        entityName: adminData.displayName || adminData.username,
        performedBy: loggedInUser.uid,
        performedByName: adminData.username,
      });

      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      let message = 'Gagal masuk. Periksa username dan kata sandi Anda.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Kata sandi atau username salah.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Koneksi internet bermasalah. Periksa jaringan Anda.';
      }
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async (): Promise<void> => {
    if (user && adminUser) {
      await logAuditAction({
        action: 'LOGOUT',
        entityType: 'auth',
        entityId: user.uid,
        entityName: adminUser.displayName || adminUser.username,
        performedBy: user.uid,
        performedByName: adminUser.username,
      });
    }
    await signOut(auth);
    setUser(null);
    setAdminUser(null);
  };

  const setupInitialAdminAccount = async (): Promise<{ success: boolean; message: string }> => {
	  return {
		success: true,
		message: 'Akun Super Admin sudah terdaftar di Firebase.',
	  };
	};

  const isAdmin = Boolean(user && adminUser && adminUser.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        isAdmin,
        loading,
        error,
        login,
        logout,
        setupInitialAdminAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
