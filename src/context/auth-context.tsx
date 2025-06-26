'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged, signOut, type User } from 'firebase/auth';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setIsLoading(false);
        console.error("Firebase Auth is not configured. Check your .env file.");
        return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsLoading(false);
      } else {
        try {
            await signInAnonymously(auth);
            // The listener will pick up the new user state and call this function again
        } catch (error) {
            console.error("Anonymous sign-in failed", error);
            setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if(auth) {
        await signOut(auth);
        setUser(null);
        // The onAuthStateChanged listener will automatically sign the user in again anonymously
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}