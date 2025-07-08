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
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      
      // Add a margin
      const margin = 40; // 40 points, approx 0.55 inches
      
      // Calculate the available content area
      const availableWidth = pdfWidth - margin * 2;
      const availableHeight = pdfHeight - margin * 2;

      // Calculate the scale ratio to fit the image within the available area while maintaining aspect ratio
      const widthRatio = availableWidth / imgWidth;
      const heightRatio = availableHeight / imgHeight;
      const ratio = Math.min(widthRatio, heightRatio);

      // Calculate the final dimensions of the image in the PDF
      const finalImgWidth = imgWidth * ratio;
      const finalImgHeight = imgHeight * ratio;

      // Calculate the top-left position to center the image
      const x = (pdfWidth - finalImgWidth) / 2;
      const y = (pdfHeight - finalImgHeight) / 2;

      // Add the image to the PDF, centered and scaled
      pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);
      
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
