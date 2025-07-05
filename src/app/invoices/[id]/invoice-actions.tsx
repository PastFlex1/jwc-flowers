'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function InvoiceActions() {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex justify-between items-center no-print">
       <Button variant="outline" onClick={() => router.back()}>
        Volver
      </Button>
      <Button onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" />
        Guardar e Imprimir Factura
      </Button>
    </div>
  );
}
