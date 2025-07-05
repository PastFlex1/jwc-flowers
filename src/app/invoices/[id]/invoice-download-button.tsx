'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
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
    
    const elementsToHide = document.querySelectorAll('.no-print');
    elementsToHide.forEach(el => ((el as HTMLElement).style.display = 'none'));

    try {
      const canvas = await html2canvas(noteElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
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
      elementsToHide.forEach(el => ((el as HTMLElement).style.display = ''));
    }
  };

  const handleDownloadPdf = async () => {
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
        
        toast({
            title: "Éxito",
            description: `El archivo ${fileName} se ha descargado.`,
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
    <Button onClick={handleDownloadPdf} disabled={isGenerating}>
      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Descargar PDF
    </Button>
  );
}
