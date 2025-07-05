'use client';

import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Invoice, Customer, Consignatario } from '@/lib/types';

const InvoiceDownloadButton = dynamic(
  () => import('./invoice-download-button').then(mod => mod.InvoiceDownloadButton),
  { 
    ssr: false,
    loading: () => <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando...</Button> 
  }
);

type InvoiceActionsProps = {
  invoice: Invoice;
  customer: Customer;
  consignatario: Consignatario | null;
};

export function InvoiceActions({ invoice, customer, consignatario }: InvoiceActionsProps) {
  const router = useRouter();

  return (
    <div className="flex justify-between items-center no-print">
      <Button variant="outline" onClick={() => router.back()}>
        Volver
      </Button>
      <div className="flex gap-2">
        <InvoiceDownloadButton
          invoice={invoice}
          customer={customer}
          consignatario={consignatario}
        />
      </div>
    </div>
  );
}
