'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { InvoicePDFDocument } from './invoice-pdf-document';
import type { Invoice, Customer, Consignatario } from '@/lib/types';

type InvoiceDownloadButtonProps = {
  invoice: Invoice;
  customer: Customer;
  consignatario: Consignatario | null;
};

// This component will be dynamically imported, so all imports within it
// (like @react-pdf/renderer) will only be loaded on the client.
export function InvoiceDownloadButton({ invoice, customer, consignatario }: InvoiceDownloadButtonProps) {
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
