'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Consignatario, Pais, Customer, Provincia } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  nombreConsignatario: z.string().min(2, { message: "The name must be at least 2 characters." }),
  customerId: z.string().min(1, { message: "Please select a customer." }),
  direccion: z.string().min(5, { message: "The address must be at least 5 characters." }),
  provincia: z.string().min(1, { message: "Please select a province/city." }),
  pais: z.string().min(1, { message: "Please select a country." }),
});

type ConsignatarioFormData = Omit<Consignatario, 'id'> & { id?: string };

type ConsignatarioFormProps = {
  onSubmit: (data: ConsignatarioFormData) => void;
  onClose: () => void;
  initialData?: Consignatario | null;
  paises: Pais[];
  customers: Customer[];
  provincias: Provincia[];
  isSubmitting: boolean;
};

export function ConsignatarioForm({ onSubmit, onClose, initialData, paises, customers, provincias, isSubmitting }: ConsignatarioFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: initialData || {
      nombreConsignatario: '',
      pais: '',
      customerId: '',
      direccion: '',
      provincia: '',
    },
  });

  const selectedCustomerId = form.watch('customerId');
  const selectedPais = form.watch('pais');

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        form.setValue('pais', customer.pais, { shouldValidate: true });
        form.setValue('provincia', customer.estadoCiudad, { shouldValidate: true });
      }
    }
  }, [selectedCustomerId, customers, form]);


  useEffect(() => {
    form.reset(initialData || {
      nombreConsignatario: '',
      pais: '',
      customerId: '',
      direccion: '',
      provincia: '',
    });
  }, [initialData, form]);

  function handleSubmit(values: z.infer<typeof formSchema>) {
    const dataToSubmit = initialData ? { ...values, id: initialData.id } : values;
    onSubmit(dataToSubmit);
  }

  const isNational = useMemo(() => selectedPais === 'Ecuador', [selectedPais]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombreConsignatario"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Consignee Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Holland Flowers" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="customerId"
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
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., 123 Rose Ave." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paises.map(pais => (
                        <SelectItem key={pais.id} value={pais.nombre}>
                          {pais.nombre}
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
            name="provincia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Province/City</FormLabel>
                {isNational ? (
                   <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a province" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provincias.map(p => (
                          <SelectItem key={p.id} value={p.nombre}>
                            {p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                ) : (
                  <FormControl>
                    <Input placeholder="e.g., Florida" {...field} />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Consignee')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
