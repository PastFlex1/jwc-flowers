'use client';

import { createContext, useContext, type ReactNode } from 'react';

// This is now a mock Auth Provider. It does not connect to Firebase Auth.
// It simply provides a consistent 'authenticated' state to the rest of the app
// to prevent the need for major refactoring.

type AuthContextType = {
  user: null; // User is always null
  isAuthenticated: true; // Always true
  logout: () => void; // Does nothing
  isLoading: false; // Never loading
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthContextType = {
    user: null,
    isAuthenticated: true,
    logout: () => console.log("Logout function called, but auth is disabled."),
    isLoading: false,
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
