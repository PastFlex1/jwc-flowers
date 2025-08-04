
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
  variedad: z.string().min(1, "Variedad es requerida."),
  nombre: z.string().min(1, "Nombre es requerido."),
  nombreColor: z.string().min(1, "Nombre del color es requerido."),
  color: z.string().min(1, "Color es requerido."),
  precio: z.coerce.number().min(0, "Precio debe ser positivo."),
});

type ProductoFormData = z.infer<typeof formSchema>;
type FormSubmitData = Omit<Producto, 'id'> & { id?: string };


type ProductoFormProps = {
  onSubmit: (data: FormSubmitData) => void;
  onClose: () => void;
  initialData?: Producto | null;
  isSubmitting: boolean;
};

export function ProductoForm({ onSubmit, onClose, initialData, isSubmitting }: ProductoFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      variedad: initialData?.variedad || '',
      nombre: initialData?.nombre || '',
      nombreColor: initialData?.nombreColor || '',
      color: initialData?.color || '#000000',
      precio: initialData?.precio || 0,
    },
  });

  useEffect(() => {
    form.reset({
      variedad: initialData?.variedad || '',
      nombre: initialData?.nombre || '',
      nombreColor: initialData?.nombreColor || '',
      color: initialData?.color || '#000000',
      precio: initialData?.precio || 0,
    });
  }, [initialData, form]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const dataToSubmit: FormSubmitData = {
      ...values,
      tipo: values.variedad,
      barras: initialData?.barras || '',
      estado: initialData?.estado || 'Activo',
    };
    
    if (initialData?.id) {
      dataToSubmit.id = initialData.id;
    }

    onSubmit(dataToSubmit);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="variedad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variedad</FormLabel>
              <FormControl>
                <Input placeholder="e.g., TALLOS" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ABSOLUT IN PINK" {...field} />
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
                <FormLabel>Color (Paleta)</FormLabel>
                <FormControl>
                    <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={field.value}
                        onChange={field.onChange}
                        className="p-1 h-10 w-14 block bg-white border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700"
                    />
                    <Input
                        placeholder="e.g., #FF0000"
                        value={field.value}
                        onChange={field.onChange}
                        className="w-full"
                    />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
          control={form.control}
          name="nombreColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Color</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Rojo Pasión" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="precio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.01" {...field} />
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
