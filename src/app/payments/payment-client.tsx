'use client';

import { useAppData } from '@/context/app-data-context';
import { PaymentForm } from './payment-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Payment } from '@/lib/types';
import { addPayment } from '@/services/payments';

export function PaymentClient() {
  const { customers, fincas, invoices, creditNotes, debitNotes, payments, refreshData } = useAppData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPayment = async (data: Omit<Payment, 'id'>) => {
    setIsSubmitting(true);
    try {
      await addPayment(data);
      toast({
        title: "Éxito",
        description: "El pago ha sido registrado y la factura actualizada.",
      });
      await refreshData();
      return true;
    } catch (error) {
      console.error("Error registering payment:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el pago.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Registrar Pago</h2>
          <p className="text-muted-foreground">Seleccione un cliente y una factura para registrar un nuevo pago.</p>
      </div>

      <div className="grid grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Pago</CardTitle>
            <CardDescription>Complete el formulario para registrar un pago.</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm 
              customers={customers}
              fincas={fincas}
              invoices={invoices}
              creditNotes={creditNotes}
              debitNotes={debitNotes}
              payments={payments}
              onSubmit={handleAddPayment}
              isSubmitting={isSubmitting}
              paymentType="sale"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
