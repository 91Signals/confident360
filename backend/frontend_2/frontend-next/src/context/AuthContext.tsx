'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Avoid running on server
    if (typeof window === 'undefined') return;
    const fb = getFirebaseAuth();
    if (!fb) return;
    const unsubscribe = onAuthStateChanged(fb.auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Initialize Google One Tap
  useEffect(() => {
    if (typeof window === 'undefined' || user) return;

    const initializeOneTap = () => {
      if (!window.google) {
        setTimeout(initializeOneTap, 100);
        return;
      }

      try {
        // IMPORTANT: Use the Web client ID from Google Cloud > APIs & Services > Credentials
        // You can set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local; falls back to the provided ID.
        const clientId =
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
          '266108283870-li4r0nh6g2mh3pfpgs57k9vs985n876q.apps.googleusercontent.com';

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleOneTapSignIn,
          auto_select: false, // Changed to false to avoid auto-login issues
          cancel_on_tap_outside: true,
          context: 'signin',
        });

        // Show the One Tap prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.warn('One Tap not displayed:', notification.getNotDisplayedReason());
          }
          if (notification.isSkippedMoment()) {
            console.warn('One Tap skipped:', notification.getSkippedReason());
          }
        });
      } catch (error) {
        console.error('Failed to initialize Google One Tap:', error);
      }
    };

    // Wait for auth to be ready
    const timer = setTimeout(initializeOneTap, 500);
    return () => clearTimeout(timer);
  }, [user]);

  const handleOneTapSignIn = async (response: any) => {
    try {
      const fb = getFirebaseAuth();
      if (!fb) {
        console.error('Firebase Auth not initialized');
        return;
      }
      
      const credential = GoogleAuthProvider.credential(response.credential);
      await signInWithCredential(fb.auth, credential);
      console.log('One Tap sign-in successful');
    } catch (error: any) {
      console.error('One Tap sign-in error:', error);
      // Fall back to regular popup sign-in if One Tap fails
      if (error?.code === 'auth/configuration-not-found' || error?.code === 'auth/invalid-credential') {
        console.warn('One Tap credential invalid, use the "Sign in with Google" button instead');
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const fb = getFirebaseAuth();
      if (!fb) throw new Error('Auth not ready');
      await signInWithPopup(fb.auth, fb.googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const fb = getFirebaseAuth();
      if (!fb) throw new Error('Auth not ready');
      await signInWithEmailAndPassword(fb.auth, email, password);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const fb = getFirebaseAuth();
      if (!fb) throw new Error('Auth not ready');
      await createUserWithEmailAndPassword(fb.auth, email, password);
    } catch (error) {
      console.error("Error signing up with email", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const fb = getFirebaseAuth();
      if (!fb) throw new Error('Auth not ready');
      await firebaseSignOut(fb.auth);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
