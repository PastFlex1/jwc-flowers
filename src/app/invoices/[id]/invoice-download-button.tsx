'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InvoiceDownloadButton() {
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
    
    try {
      const canvas = await html2canvas(noteElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null, // Use the element's background
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
    }
  };

  const handleDownloadPdf = async () => {
    const invoiceNumberEl = document.querySelector('#invoice-to-print .font-bold.text-lg');
    const invoiceNumber = invoiceNumberEl ? invoiceNumberEl.textContent : 'factura';

    setIsGenerating(true);
    try {
      const pdf = await generatePdf();
      if(pdf) {
        const fileName = `Factura-${invoiceNumber}.pdf`;
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
