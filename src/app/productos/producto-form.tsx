'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Producto } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  tipo: z.string().min(2, { message: "El tipo debe tener al menos 2 caracteres." }),
  variedad: z.string().min(2, { message: "La variedad debe tener al menos 2 caracteres." }),
  color: z.string().min(2, { message: "El color debe tener al menos 2 caracteres." }),
});

type ProductoFormData = Omit<Producto, 'id'> & { id?: string };

type ProductoFormProps = {
  onSubmit: (data: ProductoFormData) => void;
  onClose: () => void;
  initialData?: Producto | null;
  isSubmitting: boolean;
};

export function ProductoForm({ onSubmit, onClose, initialData, isSubmitting }: ProductoFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nombre: '',
      tipo: '',
      variedad: '',
      color: '',
    },
  });

  useEffect(() => {
    form.reset(initialData || {
      nombre: '',
      tipo: '',
      variedad: '',
      color: '',
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
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Rosa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Fresca" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="variedad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variedad</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Explorer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Rojo" {...field} />
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
                {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Añadir Producto')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
