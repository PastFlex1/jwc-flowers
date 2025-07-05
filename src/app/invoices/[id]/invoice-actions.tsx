'use client';

import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Invoice, Customer, Consignatario } from '@/lib/types';

// Dynamically import the new wrapper component that handles all PDF logic.
// This ensures no part of @react-pdf/renderer is loaded on the server.
const InvoiceDownloadButton = dynamic(
  () => import('./invoice-download-button').then((mod) => mod.InvoiceDownloadButton),
  {
    ssr: false,
    loading: () => (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Generando...
      </Button>
    ),
  }
);


type InvoiceActionsProps = {
  onSendEmailClick: () => void;
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
};

export function InvoiceActions({ onSendEmailClick, invoice, customer, consignatario }: InvoiceActionsProps) {
  const router = useRouter();
  
  const isDataReady = !!(invoice && customer);

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
        {isDataReady && (
            <InvoiceDownloadButton
                invoice={invoice}
                customer={customer!} // customer is guaranteed non-null by isDataReady
                consignatario={consignatario} 
            />
        )}
      </div>
    </div>
  );
}
