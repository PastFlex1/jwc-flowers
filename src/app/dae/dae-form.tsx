'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Dae } from '@/lib/types';

const formSchema = z.object({
  pais: z.string().min(2, { message: "El país debe tener al menos 2 caracteres." }),
  numeroDae: z.string().min(3, { message: "El número DAE es muy corto." }),
});

type DaeFormData = Omit<Dae, 'id'> & { id?: string };

type DaeFormProps = {
  onSubmit: (data: DaeFormData) => void;
  onClose: () => void;
  initialData?: Dae | null;
};

export function DaeForm({ onSubmit, onClose, initialData }: DaeFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      pais: '',
      numeroDae: '',
    },
  });

  useEffect(() => {
    form.reset(initialData || {
      pais: '',
      numeroDae: '',
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
          name="pais"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del País</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Ecuador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="numeroDae"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de DAE</FormLabel>
              <FormControl>
                <Input placeholder="DAE-EC-001" {...field} />
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
                {initialData ? 'Guardar Cambios' : 'Añadir DAE'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
