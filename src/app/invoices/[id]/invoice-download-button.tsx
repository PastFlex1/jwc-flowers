'use client';

import { useState } from 'react';
import { BlobProvider } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, Customer, Consignatario } from '@/lib/types';
import { InvoicePDFDocument } from './invoice-pdf-document';

type InvoiceDownloadButtonProps = {
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
};

export default function InvoiceDownloadButton({ invoice, customer, consignatario }: InvoiceDownloadButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handlePrintAndSave = (url: string | null) => {
        if (!url || !customer) {
            toast({
                title: "Error",
                description: "No se pudo obtener el PDF para procesar.",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);

        try {
            // 1. Save the file
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice-${invoice.invoiceNumber}-${customer.name.replace(/\s/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "PDF Guardado",
                description: "El archivo se ha descargado. Preparando para imprimir...",
            });

            // 2. Print the file
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);

            iframe.onload = () => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.error("Printing failed", e);
                    toast({
                        title: "Error de impresión",
                        description: "No se pudo abrir el diálogo de impresión. Por favor, imprime el archivo PDF que se descargó.",
                        variant: "destructive",
                    });
                } finally {
                    // Cleanup iframe after a short delay
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                           document.body.removeChild(iframe);
                        }
                    }, 1000);
                }
            };
        } catch (error) {
            console.error("Error processing PDF:", error);
            toast({
                title: "Error",
                description: "Ocurrió un error al procesar el PDF.",
                variant: "destructive",
            });
        } finally {
            // Add a small delay to allow the print dialog to open before re-enabling the button
            setTimeout(() => {
                setIsProcessing(false);
            }, 500);
        }
    };
    
    if (!customer) {
      return <Button disabled>Guardar e Imprimir</Button>;
    }
  
    return (
      <BlobProvider document={<InvoicePDFDocument invoice={invoice} customer={customer} consignatario={consignatario} />}>
        {({ url, loading, error }) => {
          if (error) {
              console.error("PDF Generation Error:", error);
              return <Button variant="destructive">Error al generar PDF</Button>
          }
          
          const isDisabled = loading || isProcessing || !url;

          return (
            <Button onClick={() => handlePrintAndSave(url)} disabled={isDisabled}>
              {isDisabled ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Generando...' : (isProcessing ? 'Procesando...' : 'Guardar e Imprimir')}
            </Button>
          );
        }}
      </BlobProvider>
    );
}
