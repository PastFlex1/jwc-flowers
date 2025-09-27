
'use client';

import { useAppData } from '@/context/app-data-context';
import { PaymentForm } from './payment-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Payment } from '@/lib/types';
import { addBulkPayment } from '@/services/payments';
import { DemoLimitDialog } from '@/components/ui/demo-limit-dialog';

export function PaymentClient() {
  const { customers, fincas, invoices, creditNotes, debitNotes, payments, refreshData } = useAppData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoLimitDialogOpen, setIsDemoLimitDialogOpen] = useState(false);

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
        description: "El pago ha sido registrado y las facturas actualizadas.",
      });
      await refreshData();
      return true; // Indicate success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Límite de demostración alcanzado')) {
        setIsDemoLimitDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: "No se pudo registrar el pago.",
          variant: "destructive",
        });
      }
      return false; // Indicate failure
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <div className="space-y-6">
        <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Registrar Pago a Clientes</h2>
            <p className="text-muted-foreground">Seleccione un cliente y las facturas a las que desea aplicar un pago.</p>
        </div>

        <div className="grid grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Pago</CardTitle>
              <CardDescription>Complete el formulario para registrar un pago y distribuirlo entre una o varias facturas.</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentForm 
                customers={customers}
                fincas={fincas}
                invoices={invoices}
                creditNotes={creditNotes}
                debitNotes={debitNotes}
                payments={payments}
                onSubmit={handleAddBulkPayment}
                isSubmitting={isSubmitting}
                paymentType="sale"
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <DemoLimitDialog isOpen={isDemoLimitDialogOpen} onClose={() => setIsDemoLimitDialogOpen(false)} />
    </>
  );
}
