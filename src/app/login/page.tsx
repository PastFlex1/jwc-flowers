'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Flower2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // With anonymous auth, the login page is obsolete.
  // We immediately redirect to the main app, and the AppInitializer will handle auth state.
  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center space-y-4">
        <Flower2 className="h-12 w-12 text-primary animate-pulse" />
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
}
