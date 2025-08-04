'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadInvoiceAction } from './download-invoice-action';
import type { Invoice } from '@/lib/types';

type InvoiceDownloadButtonProps = {
  invoice: Invoice;
};

export default function InvoiceDownloadButton({ invoice }: InvoiceDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const result = await downloadInvoiceAction(invoice.id);

      if (result.success && result.pdf) {
        const byteCharacters = atob(result.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const fileName = `Factura-${invoice.invoiceNumber?.trim()}.pdf`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast({
          title: 'Éxito',
          description: `El archivo ${fileName} se ha descargado.`,
        });
      } else {
        throw new Error(result.error || 'No se pudo generar el PDF.');
      }
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      toast({
        title: 'Error',
        description: `No se pudo descargar el PDF: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isGenerating}>
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isGenerating ? 'Generando PDF...' : 'Descargar PDF'}
    </Button>
  );
}
