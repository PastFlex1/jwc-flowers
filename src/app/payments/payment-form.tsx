'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import type { Payment, Invoice, CreditNote, DebitNote, BunchItem, Customer } from '@/lib/types';
import { Loader2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, toDate } from 'date-fns';

const formSchema = z.object({
  customerId: z.string().min(1, { message: "Por favor seleccione un cliente." }),
  invoiceId: z.string().min(1, { message: "Por favor seleccione una factura." }),
  amount: z.coerce.number().positive({ message: "El monto debe ser un número positivo." }),
  paymentDate: z.date({ required_error: "La fecha es requerida." }),
  paymentMethod: z.enum(['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta de Crédito', 'Tarjeta de Débito']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof formSchema>;
type FormSubmitData = Omit<Payment, 'id'>;

type PaymentFormProps = {
  onSubmit: (data: FormSubmitData) => void;
  isSubmitting: boolean;
  customers: Customer[];
  invoices: Invoice[];
  creditNotes: CreditNote[];
  debitNotes: DebitNote[];
  payments: Payment[];
  initialData?: PaymentFormData;
};

export function PaymentForm({ 
    onSubmit, 
    isSubmitting, 
    customers,
    invoices, 
    creditNotes, 
    debitNotes, 
    payments, 
    initialData 
}: PaymentFormProps) {
  const [selectedInvoiceBalance, setSelectedInvoiceBalance] = useState<number | null>(null);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(formSchema.refine(
        (data) => {
            if (selectedInvoiceBalance === null) return true;
            const tolerance = 0.01;
            return data.amount <= selectedInvoiceBalance + tolerance;
        },
        {
            message: "El monto del pago no puede exceder el saldo pendiente.",
            path: ["amount"],
        }
    )),
    mode: 'onChange',
    defaultValues: initialData || {
      customerId: '',
      invoiceId: '',
      amount: 0,
      paymentDate: new Date(),
      paymentMethod: 'Transferencia',
      reference: '',
      notes: '',
    },
  });

  const selectedCustomerId = form.watch('customerId');
  const selectedInvoiceId = form.watch('invoiceId');

  useEffect(() => {
    if (selectedCustomerId) {
        const customerInvoices = invoices.filter(inv => inv.customerId === selectedCustomerId && inv.status !== 'Paid');
        setFilteredInvoices(customerInvoices);
        form.setValue('invoiceId', '');
        setSelectedInvoiceBalance(null);
    } else {
        setFilteredInvoices([]);
        form.setValue('invoiceId', '');
        setSelectedInvoiceBalance(null);
    }
  }, [selectedCustomerId, invoices, form]);


  useEffect(() => {
    if (selectedInvoiceId) {
        const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
        if (invoice) {
            const subtotal = invoice.items.reduce((acc, item) => {
              if (!item.bunches) return acc;
              return acc + item.bunches.reduce((bunchAcc, bunch: BunchItem) => {
                  const stems = bunch.stemsPerBunch * bunch.bunches;
                  return bunchAcc + (stems * bunch.salePrice);
              }, 0);
            }, 0);

            const creditsForInvoice = creditNotes.filter(cn => cn.invoiceId === invoice.id);
            const debitsForInvoice = debitNotes.filter(dn => dn.invoiceId === invoice.id);
            const paymentsForInvoice = payments.filter(p => p.invoiceId === invoice.id);

            const totalCredits = creditsForInvoice.reduce((sum, note) => sum + note.amount, 0);
            const totalDebits = debitsForInvoice.reduce((sum, note) => sum + note.amount, 0);
            const totalPayments = paymentsForInvoice.reduce((sum, payment) => sum + payment.amount, 0);
            
            const balance = subtotal + totalDebits - totalCredits - totalPayments;
            setSelectedInvoiceBalance(balance);
            form.setValue('amount', balance);
        }
    } else {
        setSelectedInvoiceBalance(null);
    }
  }, [selectedInvoiceId, invoices, creditNotes, debitNotes, payments, form]);

  function handleSubmit(values: PaymentFormData) {
    const { customerId, ...dataToSubmit } = values;
    const finalData: FormSubmitData = {
        ...dataToSubmit,
        paymentDate: values.paymentDate.toISOString(),
    };
    onSubmit(finalData);
    form.reset({
      customerId: '',
      invoiceId: '',
      amount: 0,
      paymentDate: new Date(),
      paymentMethod: 'Transferencia',
      reference: '',
      notes: '',
    });
    setSelectedInvoiceBalance(null);
    setFilteredInvoices([]);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="invoiceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Factura a Pagar</FormLabel>
               <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCustomerId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedCustomerId ? "Seleccione un cliente primero" : "Seleccione una factura"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredInvoices.map(invoice => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNumber}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedInvoiceBalance !== null && (
            <div className="p-3 bg-accent/50 rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">
                    Saldo Pendiente: <span className="font-bold text-foreground">${selectedInvoiceBalance.toFixed(2)}</span>
                </p>
            </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="100.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField control={form.control} name="paymentDate" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Pago</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(toDate(field.value), "PPP") : <span>Seleccionar fecha</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
          )}/>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pago</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="Tarjeta de Débito">Tarjeta de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia / Banco</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Banco Pichincha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
       
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Adicionales</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: Abono a factura..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting || !selectedInvoiceId}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Guardando...' : 'Registrar Pago'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
