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
                <p className="text-muted-foreground">Cargando datos de demostración...</p>
            </div>
        </div>
    );
}

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isLoading: isDataLoading, hasBeenLoaded } = useAppData();
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
     if (!hasBeenLoaded || isDataLoading) {
        return <AppLoadingScreen />;
     }
     if (pathname === '/login') {
        // If authenticated and on login page, show loading while redirecting
        return <AppLoadingScreen />;
     }
     return <AppShell>{children}</AppShell>;
  }

  // If not authenticated, render children (which should be the login page)
  return <>{children}</>;
}
