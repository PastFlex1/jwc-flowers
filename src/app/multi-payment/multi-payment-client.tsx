'use client';

import { useAppData } from '@/context/app-data-context';
import { MultiPaymentForm } from './multi-payment-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Payment } from '@/lib/types';
import { addBulkPayment } from '@/services/payments';

export function MultiPaymentClient() {
  const { customers, fincas, invoices, creditNotes, debitNotes, payments, refreshData } = useAppData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBulkPayment = async (
    paymentDetails: Omit<Payment, 'id' | 'invoiceId' | 'amount'>,
    selectedInvoices: { invoiceId: string; balance: number; type: 'sale' | 'purchase' | 'both', flightDate: string }[],
    totalAmount: number
  ) => {
    setIsSubmitting(true);
    try {
      await addBulkPayment(paymentDetails, selectedInvoices, totalAmount);
      toast({
        title: "Éxito",
        description: "El pago masivo ha sido registrado y las facturas actualizadas.",
      });
      await refreshData();
      return true; // Indicate success
    } catch (error) {
      console.error("Error registering bulk payment:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el pago masivo.",
        variant: "destructive",
      });
      return false; // Indicate failure
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Registrar Pago para Múltiples Facturas</h2>
          <p className="text-muted-foreground">Seleccione un cliente o proveedor y las facturas a las que desea aplicar un pago.</p>
      </div>

      <div className="grid grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Pago Masivo</CardTitle>
            <CardDescription>Complete el formulario para registrar un pago y distribuirlo entre varias facturas.</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiPaymentForm 
              customers={customers}
              fincas={fincas}
              invoices={invoices}
              creditNotes={creditNotes}
              debitNotes={debitNotes}
              payments={payments}
              onSubmit={handleAddBulkPayment}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
