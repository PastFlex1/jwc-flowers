'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isLoading: isDataLoading } = useAppData();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthLoading, pathname, router]);

  if (isAuthLoading) {
    return <AppLoadingScreen />;
  }

  if (isAuthenticated) {
     if (isDataLoading) {
        return <AppLoadingScreen />;
     }
     if (pathname === '/login') {
        return <AppLoadingScreen />; // Or show children if you want login page to be accessible when logged in
     }
     return <AppShell>{children}</AppShell>;
  }

  // Not authenticated, and not loading, show children (which should be the login page)
  return <>{children}</>;
}
