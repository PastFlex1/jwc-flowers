
'use client';

import { useAppData } from '@/context/app-data-context';
import { PaymentForm } from '@/app/payments/payment-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import type { Payment, Customer, Invoice } from '@/lib/types';
import { addPayment } from '@/services/payments';

export function RecordPurchasePaymentClient() {
  const { customers, invoices, creditNotes, debitNotes, payments, refreshData } = useAppData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReceiptData, setLastReceiptData] = useState<{ payment: Payment; customer: Customer; invoice: Invoice} | null>(null);

  const purchaseInvoices = useMemo(() => invoices.filter(inv => inv.type === 'purchase'), [invoices]);

  const handleAddPayment = async (data: Omit<Payment, 'id'>, customer: Customer, invoice: Invoice) => {
    setIsSubmitting(true);
    setLastReceiptData(null);
    try {
      const paymentId = await addPayment(data); 
      const newPayment = { ...data, id: paymentId };

      setLastReceiptData({
          payment: newPayment,
          customer: customer,
          invoice: invoice
      });

      toast({
        title: "Éxito",
        description: "El pago de la compra ha sido registrado y la factura actualizada.",
      });
      await refreshData();
      return newPayment;
    } catch (error) {
      console.error("Error registering purchase payment:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el pago de la compra.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Registrar Pago de Compra</h2>
          <p className="text-muted-foreground">Seleccione un proveedor y una factura de compra para registrar un pago.</p>
      </div>

      <div className="grid grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Pago de Compra</CardTitle>
            <CardDescription>Complete el formulario para registrar un pago a un proveedor.</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm 
              customers={customers}
              invoices={purchaseInvoices} // Use only purchase invoices
              creditNotes={creditNotes}
              debitNotes={debitNotes}
              payments={payments}
              onSubmit={handleAddPayment}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
