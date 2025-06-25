'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paises } from '@/lib/mock-data';
import type { Carguera } from '@/lib/types';

const formSchema = z.object({
  nombreCarguera: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  pais: z.string().min(1, { message: "Por favor seleccione un país." }),
});

type CargueraFormData = Omit<Carguera, 'id'> & { id?: string };

type CargueraFormProps = {
  onSubmit: (data: CargueraFormData) => void;
  onClose: () => void;
  initialData?: Carguera | null;
};

export function CargueraForm({ onSubmit, onClose, initialData }: CargueraFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nombreCarguera: '',
      pais: '',
    },
  });

  useEffect(() => {
    form.reset(initialData || {
      nombreCarguera: '',
      pais: '',
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
          name="nombreCarguera"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Carguera</FormLabel>
              <FormControl>
                <Input placeholder="e.g., DHL" {...field} />
              </FormControl>
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
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
            </Button>
            <Button type="submit">
                {initialData ? 'Guardar Cambios' : 'Añadir Carguera'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
