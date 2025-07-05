'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, Customer, Consignatario } from '@/lib/types';

type InvoiceDownloadButtonProps = {
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
};

export default function InvoiceDownloadButton({ invoice, customer }: InvoiceDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePdf = async () => {
    const noteElement = document.getElementById('invoice-to-print');
    if (!noteElement) {
      toast({
        title: "Error",
        description: "No se pudo encontrar el contenido de la factura para generar el PDF.",
        variant: "destructive",
      });
      return null;
    }
    
    // Manually hide elements with .no-print class as html2canvas may not respect @media print styles
    const elementsToHide = document.querySelectorAll('.no-print');
    elementsToHide.forEach(el => ((el as HTMLElement).style.display = 'none'));

    try {
      const canvas = await html2canvas(noteElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        // Use the canvas dimensions to create a pixel-perfect PDF
        format: [canvas.width, canvas.height] 
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      return pdf;
    } catch (error) {
      console.error("Error during PDF generation:", error);
      toast({
        title: "Error de PDF",
        description: "Ocurrió un error al generar la imagen de la factura.",
        variant: "destructive",
      });
      return null;
    } finally {
      // Ensure hidden elements are shown again
      elementsToHide.forEach(el => ((el as HTMLElement).style.display = ''));
    }
  };

  const handlePrintAndSave = async () => {
    if (!customer) {
      toast({
        title: "Datos incompletos",
        description: "No hay datos del cliente para generar el nombre del archivo.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const pdf = await generatePdf();
      if(pdf) {
        const fileName = `Factura-${invoice.invoiceNumber}_${customer.name.replace(/\s/g, '_')}.pdf`;
        pdf.save(fileName);
        
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.src = pdfUrl;
        document.body.appendChild(iframe);

        iframe.onload = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (e) {
                console.error("Printing failed", e);
                toast({
                    title: "Error de impresión",
                    description: "No se pudo abrir el diálogo de impresión. Por favor, imprime el archivo PDF descargado.",
                    variant: "destructive",
                });
            } finally {
                // Cleanup after a short delay
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                    URL.revokeObjectURL(pdfUrl);
                }, 1000);
            }
        };
        
        toast({
            title: "Éxito",
            description: "PDF guardado. Preparando impresión...",
        });
      }
    } catch (error) {
        console.error("Error processing PDF:", error);
        toast({
            title: "Error",
            description: "Ocurrió un error inesperado al procesar el PDF.",
            variant: "destructive",
        });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handlePrintAndSave} disabled={isGenerating}>
      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
      Guardar e Imprimir
    </Button>
  );
}
