'use client';

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
import type { DebitNote, Invoice } from '@/lib/types';
import { Loader2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, toDate } from 'date-fns';

const formSchema = z.object({
  invoiceId: z.string().min(1, { message: "Please select an invoice." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
  reason: z.string().min(5, { message: "Reason must be at least 5 characters." }),
  date: z.date({ required_error: "Date is required." }),
});

type DebitNoteFormData = Omit<DebitNote, 'id' | 'invoiceNumber' | 'date'> & { date: Date };
type FormSubmitData = Omit<DebitNote, 'id'>;


type DebitNoteFormProps = {
  onSubmit: (data: FormSubmitData) => void;
  onClose: () => void;
  isSubmitting: boolean;
  invoices: Invoice[];
};

export function DebitNoteForm({ onSubmit, onClose, isSubmitting, invoices }: DebitNoteFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      invoiceId: '',
      amount: 0,
      reason: '',
      date: new Date(),
    },
  });

  function handleSubmit(values: z.infer<typeof formSchema>) {
    const selectedInvoice = invoices.find(inv => inv.id === values.invoiceId);
    if (!selectedInvoice) return;

    const dataToSubmit: FormSubmitData = {
        ...values,
        invoiceNumber: selectedInvoice.invoiceNumber,
        date: values.date.toISOString(),
    };
    onSubmit(dataToSubmit);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="invoiceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice to Debit</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an invoice" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {invoices.map(invoice => (
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
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount to Debit</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="50.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Price adjustment" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Debit Note Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(toDate(field.value), "PPP") : <span>Select date</span>}
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
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Add Debit Note'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
