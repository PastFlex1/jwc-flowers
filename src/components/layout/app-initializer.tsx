'use client';

import { useAuth } from '@/context/auth-context';
import { AppShell } from './app-shell';
import { AppDataProvider } from '@/context/app-data-context';

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  // Since the mock AuthProvider always sets isAuthenticated to true and isLoading to false,
  // this will always render the main application immediately.
  // The loading and error states for authentication are no longer needed.
  if (isAuthenticated) {
     return (
        <AppDataProvider>
          <AppShell>{children}</AppShell>
        </AppDataProvider>
      );
  }

  // This part should theoretically never be reached with the mock provider.
  return null;
}
