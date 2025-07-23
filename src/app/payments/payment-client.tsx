
'use client';

import { useAppData } from '@/context/app-data-context';
import { PaymentForm } from './payment-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Payment } from '@/lib/types';


export function PaymentClient() {
  const { invoices, refreshData } = useAppData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This is a placeholder for the actual addPayment service function
  const handleAddPayment = async (data: Omit<Payment, 'id'>) => {
    setIsSubmitting(true);
    console.log("Submitting payment data:", data);
    try {
      // Here you would call your service to add the payment to Firestore
      // await addPayment(data); 
      toast({
        title: "Éxito (Simulación)",
        description: "El pago ha sido registrado.",
      });
      // await refreshData();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el pago.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6">
      <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Registrar Pago</h2>
          <p className="text-muted-foreground">Seleccione una factura y registre un nuevo pago.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Pago</CardTitle>
          <CardDescription>Complete el formulario para registrar un pago a una factura.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentForm 
            invoices={invoices}
            onSubmit={handleAddPayment}
            isSubmitting={isSubmitting}
            onClose={() => {}} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
