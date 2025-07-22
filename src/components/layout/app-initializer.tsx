'use client';

import { useAuth } from '@/context/auth-context';
import { AppShell } from './app-shell';
import { useAppData } from '@/context/app-data-context';
import { Flower2 } from 'lucide-react';

function AppLoadingScreen() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
             <div className="flex flex-col items-center gap-4">
                <Flower2 className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">Syncing data...</p>
            </div>
        </div>
    );
}


export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { isLoading } = useAppData();

  if (isAuthenticated) {
     if (isLoading) {
        return <AppLoadingScreen />;
     }
     return (
        <AppShell>{children}</AppShell>
      );
  }

  // Fallback for non-authenticated state if ever needed
  return <AppLoadingScreen />;
}
