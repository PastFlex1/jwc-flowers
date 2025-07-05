'use client';

import { BlobProvider } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { InvoicePDFDocument } from './invoice-pdf-document';
import type { Invoice, Customer, Consignatario } from '@/lib/types';

type InvoiceDownloadButtonProps = {
  invoice: Invoice;
  customer: Customer;
  consignatario: Consignatario | null;
};

export function InvoiceDownloadButton({ invoice, customer, consignatario }: InvoiceDownloadButtonProps) {
  
  const handleDownload = (url: string | null) => {
    if (!url) return;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <BlobProvider document={<InvoicePDFDocument invoice={invoice} customer={customer} consignatario={consignatario} />}>
      {({ url, loading, error }) => {
        if (error) {
            console.error(error);
            return <Button variant="destructive">Error</Button>
        }
        
        return (
          <Button onClick={() => handleDownload(url)} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Generando PDF...' : 'Descargar PDF'}
          </Button>
        );
      }}
    </BlobProvider>
  );
}
