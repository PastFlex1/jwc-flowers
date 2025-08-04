'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import InvoiceDownloadButton from './invoice-download-button';
import { SendInvoiceDialog } from '../send-invoice-dialog';
import type { Invoice, Customer, Consignatario, Carguera, Pais } from '@/lib/types';
import { Send } from 'lucide-react';

type InvoiceActionsProps = {
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
  carguera: Carguera | null;
  pais: Pais | null;
};

export function InvoiceActions({ invoice, customer, consignatario, carguera, pais }: InvoiceActionsProps) {
  const router = useRouter();
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <InvoiceDownloadButton
          invoice={invoice}
          customer={customer}
          consignatario={consignatario}
          carguera={carguera}
          pais={pais}
        />
        <Button onClick={() => setIsSendDialogOpen(true)} variant="outline">
          <Send className="mr-2 h-4 w-4" />
          Enviar por Correo
        </Button>
      </div>

      <SendInvoiceDialog
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        invoice={invoice}
        customer={customer}
      />
    </>
  );
}
