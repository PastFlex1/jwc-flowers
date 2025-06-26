'use client';

import { useAuth } from '@/context/auth-context';
import { AppShell } from './app-shell';
import { AppDataProvider } from '@/context/app-data-context';

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
     return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
             <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-muted-foreground">Autenticando y conectando...</p>
            </div>
        </div>
    );
  }

  // Once Firebase Auth is initialized and the user is signed in (anonymously),
  // we render the main application layout.
  if (isAuthenticated) {
     return (
        <AppDataProvider>
          <AppShell>{children}</AppShell>
        </AppDataProvider>
      );
  }
  
  // This state is reached if auth fails. It's a fallback.
  return (
       <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <p className="text-destructive font-semibold">Error de Autenticación</p>
            <p className="text-muted-foreground">No se pudo conectar a Firebase. Por favor, recargue la página.</p>
        </div>
      </div>
  );
}
