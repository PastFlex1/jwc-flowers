'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Marcacion, Customer } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  numeroMarcacion: z.string().min(1, { message: "Marking number is required." }),
  cliente: z.string().min(1, { message: "Please select a customer." }),
});

type MarcacionFormData = Omit<Marcacion, 'id'> & { id?: string };

type MarcacionFormProps = {
  onSubmit: (data: MarcacionFormData) => void;
  onClose: () => void;
  initialData?: Marcacion | null;
  isSubmitting: boolean;
  customers: Customer[];
};

export function MarcacionForm({ onSubmit, onClose, initialData, isSubmitting, customers }: MarcacionFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: initialData || {
      numeroMarcacion: '',
      cliente: '',
    },
  });

  useEffect(() => {
    form.reset(initialData || {
      numeroMarcacion: '',
      cliente: '',
    });
  }, [initialData, form]);

  function handleSubmit(values: z.infer<typeof formSchema>) {
    const dataToSubmit = initialData ? { ...values, id: initialData.id } : values;
    onSubmit(dataToSubmit);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="numeroMarcacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marking Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., MARK-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Marking')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
