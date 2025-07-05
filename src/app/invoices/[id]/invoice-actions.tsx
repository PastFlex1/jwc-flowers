'use client';

import { Button } from '@/components/ui/button';
import { Download, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

type InvoiceActionsProps = {
  onSendEmailClick: () => void;
};

export function InvoiceActions({ onSendEmailClick }: InvoiceActionsProps) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex justify-between items-center no-print">
       <Button variant="outline" onClick={() => router.back()}>
        Volver
      </Button>
      <div className="flex gap-2">
        <Button onClick={onSendEmailClick} variant="outline">
          <Mail className="mr-2 h-4 w-4" />
          Enviar por Correo
        </Button>
        <Button onClick={handlePrint}>
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </div>
    </div>
  );
}
