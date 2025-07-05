'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { InvoicePDFDocument } from './invoice-pdf-document';
import type { Invoice, Customer, Consignatario } from '@/lib/types';
import { useState, useEffect } from 'react';

type InvoiceDownloadButtonProps = {
  invoice: Invoice;
  customer: Customer;
  consignatario: Consignatario | null;
};

// This component will be dynamically imported, so all imports within it
// (like @react-pdf/renderer) will only be loaded on the client.
export function InvoiceDownloadButton({ invoice, customer, consignatario }: InvoiceDownloadButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsClient(true);
  }, []);

  // On the server, and on the initial client render, return a placeholder.
  if (!isClient) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Generando...
      </Button>
    );
  }

  // After the component has mounted on the client, render the actual download link.
  return (
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
  );
}
