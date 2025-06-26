'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Pais } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre del país debe tener al menos 2 caracteres." }),
});

type PaisFormData = Omit<Pais, 'id'> & { id?: string };

type PaisFormProps = {
  onSubmit: (data: PaisFormData) => void;
  onClose: () => void;
  initialData?: Pais | null;
  isSubmitting: boolean;
};

export function PaisForm({ onSubmit, onClose, initialData, isSubmitting }: PaisFormProps) {
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
              <FormLabel>Nombre del País</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Ecuador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Añadir País')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
