'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@/lib/types';

type InvoiceDownloadButtonProps = {
  invoice: Invoice;
};

export default function InvoiceDownloadButton({ invoice }: InvoiceDownloadButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();

  const handlePrint = () => {
    setIsPrinting(true);
    
    // Use the browser's native print functionality
    // This will allow the user to "Save as PDF"
    window.print();

    toast({
      title: 'Preparando para guardar',
      description: 'Seleccione "Guardar como PDF" en el diálogo de impresión.',
    });
    
    // We can't know when the user closes the print dialog, so we'll reset the state after a short delay.
    setTimeout(() => {
        setIsPrinting(false);
    }, 3000);
  };

  return (
    <Button onClick={handlePrint} disabled={isPrinting}>
      {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {isPrinting ? 'Preparando...' : 'Descargar PDF'}
    </Button>
  );
}
