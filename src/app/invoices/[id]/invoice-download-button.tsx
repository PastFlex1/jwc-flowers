'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import type { Invoice, Customer, Consignatario, Carguera, Pais } from '@/lib/types';
import { InvoicePdfDocument } from './invoice-pdf-document';

type InvoiceDownloadButtonProps = {
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
  carguera: Carguera | null;
  pais: Pais | null;
};

export default function InvoiceDownloadButton({ invoice, customer, consignatario, carguera, pais }: InvoiceDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Generando PDF...
      </Button>
    );
  }

  const fileName = `Factura-${invoice.invoiceNumber?.trim()}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <InvoicePdfDocument
          invoice={invoice}
          customer={customer}
          consignatario={consignatario}
          carguera={carguera}
          pais={pais}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Generando PDF...' : 'Descargar PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
