'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Mail, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDFDocument } from './invoice-pdf-document';
import type { Invoice, Customer, Consignatario } from '@/lib/types';

type InvoiceActionsProps = {
  onSendEmailClick: () => void;
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
};

export function InvoiceActions({ onSendEmailClick, invoice, customer, consignatario }: InvoiceActionsProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        {isClient && isDataReady && (
            <PDFDownloadLink
                document={<InvoicePDFDocument invoice={invoice} customer={customer} consignatario={consignatario} />}
                fileName={`Invoice-${invoice.invoiceNumber}.pdf`}
            >
            {({ loading }) => (
                <Button disabled={loading}>
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                )}
                {loading ? 'Generando...' : 'Descargar PDF'}
                </Button>
            )}
            </PDFDownloadLink>
        )}
      </div>
    </div>
  );
}
