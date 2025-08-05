'use client';

import { useAppData } from '@/context/app-data-context';
import { PaymentForm } from './payment-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import type { Payment, Customer } from '@/lib/types';
import { addPayment } from '@/services/payments';
import { PaymentReceipt } from './payment-receipt';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Loader2 } from 'lucide-react';

export type ReceiptData = {
    payment: Payment;
    customer: Customer | null;
}

export function PaymentClient() {
  const { customers, invoices, creditNotes, debitNotes, payments, refreshData } = useAppData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const customerMap = useMemo(() => {
    return customers.reduce((acc, customer) => {
      acc[customer.id] = customer;
      return acc;
    }, {} as Record<string, Customer>);
  }, [customers]);
  
  const handleAddPayment = async (data: Omit<Payment, 'id'>) => {
    setIsSubmitting(true);
    setLastPayment(null);
    try {
      const paymentId = await addPayment(data); 
      const newPayment = { ...data, id: paymentId };
      setLastPayment(newPayment);

      toast({
        title: "Éxito",
        description: "El pago ha sido registrado y la factura actualizada.",
      });
      await refreshData();
    } catch (error) {
      console.error("Error registering payment:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el pago.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    const receiptElement = document.getElementById('receipt-to-print');
    if (!receiptElement) {
        toast({ title: "Error", description: "No se pudo encontrar el comprobante para generar el PDF.", variant: "destructive" });
        return;
    }

    setIsGeneratingPdf(true);
    try {
        const canvas = await html2canvas(receiptElement, { scale: 3, useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
        const imgWidth = canvas.width * ratio;
        const imgHeight = canvas.height * ratio;
        pdf.addImage(imgData, 'PNG', (pdfWidth - imgWidth) / 2, 0, imgWidth, imgHeight);
        pdf.save(`Comprobante-Ingreso-${lastPayment?.invoiceId}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ title: "Error", description: "Ocurrió un error al generar el PDF.", variant: "destructive" });
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const selectedCustomerForReceipt = lastPayment ? customers.find(c => invoices.find(i => i.id === lastPayment?.invoiceId)?.customerId === c.id) : null;
  
  return (
    <div className="space-y-6">
      <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Registrar Pago</h2>
          <p className="text-muted-foreground">Seleccione un cliente y una factura para registrar un nuevo pago.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Pago</CardTitle>
            <CardDescription>Complete el formulario para registrar un pago.</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm 
              customers={customers}
              invoices={invoices}
              creditNotes={creditNotes}
              debitNotes={debitNotes}
              payments={payments}
              onSubmit={handleAddPayment}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
        
        {lastPayment && selectedCustomerForReceipt && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Comprobante de Ingreso</CardTitle>
                <CardDescription>El pago ha sido registrado exitosamente.</CardDescription>
              </div>
              <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Generar Comprobante
              </Button>
            </CardHeader>
            <CardContent>
              <PaymentReceipt
                  payment={lastPayment}
                  customer={selectedCustomerForReceipt}
                  invoice={invoices.find(inv => inv.id === lastPayment.invoiceId)!}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
