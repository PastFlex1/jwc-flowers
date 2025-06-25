'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  login: (user: string, pass:string) => boolean;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('isAuthenticated');
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Couldn't access localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (user: string, pass: string): boolean => {
    if (user === 'admin' && pass === 'admin123') {
      try {
        localStorage.setItem('isAuthenticated', 'true');
      } catch (error) {
         console.error("Couldn't access localStorage", error);
      }
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    try {
      localStorage.removeItem('isAuthenticated');
    } catch (error) {
      console.error("Couldn't access localStorage", error);
    }
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
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
