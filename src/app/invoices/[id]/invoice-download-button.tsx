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
    const invoiceNumberEl = document.querySelector('#invoice-to-print .font-bold.text-base');
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
        scale: 2,
        useCORS: true,
        logging: false,
        width: noteElement.scrollWidth,
        height: noteElement.scrollHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const newImgWidth = imgWidth * ratio;
      const newImgHeight = imgHeight * ratio;

      const x = (pdfWidth - newImgWidth) / 2;
      const y = (pdfHeight - newImgHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, newImgWidth, newImgHeight);
      
      const fileName = `Factura-${invoiceNumber?.trim()}.pdf`;
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
