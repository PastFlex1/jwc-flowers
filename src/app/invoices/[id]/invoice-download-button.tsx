'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@/lib/types';

type InvoiceDownloadButtonProps = {
  invoice: Invoice;
};

export default function InvoiceDownloadButton({ invoice }: InvoiceDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    const invoiceElement = document.getElementById('invoice-to-print');

    if (!invoiceElement) {
      toast({
        title: "Error",
        description: "No se pudo encontrar el contenido para generar el PDF.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(invoiceElement, {
        scale: 3,
        useCORS: true,
        logging: false,
        width: invoiceElement.scrollWidth,
        height: invoiceElement.scrollHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
      
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;
      
      const x = (pdfWidth - imgWidth) / 2;
      
      // Lógica de multipágina para orientación vertical
      let position = 0;
      let remainingCanvasHeight = canvas.height;
      const pageCanvasHeight = (pdfHeight / imgHeight) * canvasHeight;


      while (remainingCanvasHeight > 0) {
        // Clonar el canvas para recortar la porción de la página actual
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageCanvasHeight;
        
        const pageCtx = pageCanvas.getContext('2d');
        if (pageCtx) {
           pageCtx.drawImage(
              canvas,
              0, // sx
              position, // sy
              canvas.width, // sWidth
              pageCanvasHeight, // sHeight
              0, // dx
              0, // dy
              canvas.width, // dWidth
              pageCanvasHeight // dHeight
            );

            const pageImgData = pageCanvas.toDataURL('image/png');
            pdf.addImage(pageImgData, 'PNG', x, 0, imgWidth, pdfHeight * (pageCanvas.height / pageCanvasHeight));
        }

        remainingCanvasHeight -= pageCanvasHeight;
        position += pageCanvasHeight;
        
        if (remainingCanvasHeight > 0) {
          pdf.addPage();
        }
      }

      const fileName = `Factura-${invoice.invoiceNumber.trim()}.pdf`;
      pdf.save(fileName);

      toast({
        title: 'Éxito',
        description: `El archivo ${fileName} se ha descargado.`,
      });
    } catch (error) {
      console.error("Error al procesar el PDF:", error);
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
      {isGenerating ? 'Generando...' : 'Descargar PDF'}
    </Button>
  );
}
