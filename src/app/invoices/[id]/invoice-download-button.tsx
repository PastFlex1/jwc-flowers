'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateInvoicePdf } from '@/lib/pdfmake-generator';
import type { Invoice, Customer, Consignatario, Carguera, Pais } from '@/lib/types';
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';


type InvoiceDownloadButtonProps = {
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
  carguera: Carguera | null;
  pais: Pais | null;
};

export default function InvoiceDownloadButton({ invoice, customer, consignatario, carguera, pais }: InvoiceDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    if (!customer) {
      toast({
        title: "Error",
        description: "Datos del cliente no encontrados.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Assign fonts inside the handler
      (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
      
      const docDefinition = await generateInvoicePdf({
        invoice,
        customer,
        consignatario,
        carguera,
        pais,
      });
      
      const fileName = `Factura-${invoice.invoiceNumber?.trim()}.pdf`;
      pdfMake.createPdf(docDefinition).download(fileName);
      
      toast({
          title: "Éxito",
          description: `El archivo ${fileName} se ha descargado.`,
      });

    } catch (error) {
      console.error("Error processing PDF with pdfmake:", error);
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
