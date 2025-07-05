'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function InvoiceActions() {
  const router = useRouter();

  return (
    <div className="flex justify-between items-center no-print">
      <Button variant="outline" onClick={() => router.back()}>
        Volver
      </Button>
      <div className="flex gap-2">
        <Button onClick={() => window.print()}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </div>
    </div>
  );
}
