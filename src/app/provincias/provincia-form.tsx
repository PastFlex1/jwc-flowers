'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Provincia } from '@/lib/types';

const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre de la provincia debe tener al menos 2 caracteres." }),
});

type ProvinciaFormData = Omit<Provincia, 'id'> & { id?: string };

type ProvinciaFormProps = {
  onSubmit: (data: ProvinciaFormData) => void;
  onClose: () => void;
  initialData?: Provincia | null;
};

export function ProvinciaForm({ onSubmit, onClose, initialData }: ProvinciaFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nombre: '',
    },
  });

  useEffect(() => {
    form.reset(initialData || {
      nombre: '',
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
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Provincia</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Pichincha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
            </Button>
            <Button type="submit">
                {initialData ? 'Guardar Cambios' : 'Añadir Provincia'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
