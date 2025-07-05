'use client';

import { BlobProvider } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import type { Invoice, Customer, Consignatario } from '@/lib/types';
import { InvoicePDFDocument } from './invoice-pdf-document';

type InvoiceDownloadButtonProps = {
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
};

export default function InvoiceDownloadButton({ invoice, customer, consignatario }: InvoiceDownloadButtonProps) {
    const handleDownload = (url: string | null) => {
        if (!url) return;
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!customer) {
      // This should not happen if called correctly, but it's a good guard.
      return <Button disabled>Descargar PDF</Button>;
    }
  
    return (
      <BlobProvider document={<InvoicePDFDocument invoice={invoice} customer={customer} consignatario={consignatario} />}>
        {({ url, loading, error }) => {
          if (error) {
              console.error("PDF Generation Error:", error);
              return <Button variant="destructive">Error PDF</Button>
          }
          
          return (
            <Button onClick={() => handleDownload(url)} disabled={loading || !url}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Generando...' : 'Descargar PDF'}
            </Button>
          );
        }}
      </BlobProvider>
    );
}
