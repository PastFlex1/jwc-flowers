'use client';

import { useEffect } from 'react';
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

const formSchema = z.object({
  nombreConsignatario: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  customerId: z.string().min(1, { message: "Por favor seleccione un cliente." }),
  direccion: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  provincia: z.string().min(1, { message: "Por favor seleccione una provincia." }),
  pais: z.string().min(1, { message: "Por favor seleccione un país." }),
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
    defaultValues: initialData || {
      nombreConsignatario: '',
      pais: '',
      customerId: '',
      direccion: '',
      provincia: '',
    },
  });

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombreConsignatario"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Consignatario</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Flores de Holanda" {...field} />
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
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Av. de las Rosas 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="provincia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una provincia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {provincias.map(provincia => (
                        <SelectItem key={provincia.id} value={provincia.nombre}>
                          {provincia.nombre}
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
            name="pais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un país" />
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
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Añadir Consignatario')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
