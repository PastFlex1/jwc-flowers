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

  const handleDownloadPdf = async () => {
    const invoiceNumberEl = document.querySelector('#invoice-to-print .font-bold.text-lg');
    const invoiceNumber = invoiceNumberEl ? invoiceNumberEl.textContent : 'factura';
    const noteElement = document.getElementById('invoice-to-print');

    if (!noteElement) {
      toast({
        title: "Error",
        description: "No se pudo encontrar el contenido de la factura para generar el PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(noteElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create a PDF with dimensions based on the content itself
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width + 40, canvas.height + 40] // Add 20px padding on all sides
      });

      // Add the captured image to the PDF
      pdf.addImage(imgData, 'PNG', 20, 20, canvas.width, canvas.height);
      
      const fileName = `Factura-${invoiceNumber}.pdf`;
      pdf.save(fileName);
      
      toast({
          title: "Éxito",
          description: `El archivo ${fileName} se ha descargado.`,
      });

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
