'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InvoiceDownloadButton() {
    const { toast } = useToast();

    const handlePrint = () => {
        toast({
            title: "Preparando impresión...",
            description: "Por favor, seleccione 'Guardar como PDF' en el diálogo de impresión.",
        });
        window.print();
    };
  
    return (
        <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir / Guardar PDF
        </Button>
    );
}
