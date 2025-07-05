'use client';

import { useState, useEffect, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import type { Invoice, Customer, Consignatario } from '@/lib/types';
import type { InvoicePDFDocumentProps } from './invoice-pdf-document';

type BlobProviderProps = {
  document: React.ReactElement;
  children: (props: { url: string | null; loading: boolean; error: Error | null }) => React.ReactNode;
};

type InvoiceDownloadButtonProps = {
  invoice: Invoice;
  customer: Customer;
  consignatario: Consignatario | null;
};

export function InvoiceDownloadButton({ invoice, customer, consignatario }: InvoiceDownloadButtonProps) {
  const [PdfComponents, setPdfComponents] = useState<{
    BlobProvider: ComponentType<BlobProviderProps>;
    InvoicePDFDocument: ComponentType<InvoicePDFDocumentProps>;
  } | null>(null);

  useEffect(() => {
    // This effect runs only on the client, ensuring the PDF library is never loaded on the server.
    Promise.all([
      import('@react-pdf/renderer'),
      import('./invoice-pdf-document')
    ]).then(([{ BlobProvider }, { InvoicePDFDocument }]) => {
      setPdfComponents({
        BlobProvider: BlobProvider,
        InvoicePDFDocument: InvoicePDFDocument,
      });
    });
  }, []);

  const handleDownload = (url: string | null) => {
    if (!url) return;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render a loading state until the client-side components are loaded.
  if (!PdfComponents) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando...
      </Button>
    )
  }

  const { BlobProvider, InvoicePDFDocument } = PdfComponents;

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
