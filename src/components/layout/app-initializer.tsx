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
                <p className="text-muted-foreground">Sincronizando datos...</p>
            </div>
        </div>
    );
}


export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  // The global isLoading check has been removed.
  // Each page component will handle its own loading state if needed,
  // preventing the loading screen from appearing on every navigation.
  if (isAuthenticated) {
     return (
        <AppShell>{children}</AppShell>
      );
  }

  // Show a loading screen only if not authenticated (e.g., initial load)
  return <AppLoadingScreen />;
}
