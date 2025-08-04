'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StatementData } from './account-statement-client';

type AccountStatementDownloadButtonProps = {
  data: StatementData;
};

export default function AccountStatementDownloadButton({ data }: AccountStatementDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    const statementElement = document.getElementById('statement-to-print');

    if (!statementElement) {
      toast({
        title: "Error",
        description: "No se pudo encontrar el contenido para generar el PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(statementElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: statementElement.scrollWidth,
        height: statementElement.scrollHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
      
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;
      
      const x = (pdfWidth - imgWidth) / 2;
      const y = 0; // Align to top

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      
      const fileName = `Estado-de-Cuenta-${data.customer.name.replace(/ /g, '_')}.pdf`;
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
