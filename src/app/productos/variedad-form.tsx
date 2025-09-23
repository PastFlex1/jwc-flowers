
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre del producto debe tener al menos 2 caracteres." }),
});

type VariedadFormProps = {
  onSubmit: (data: { nombre: string }) => void;
  onClose: () => void;
  isSubmitting: boolean;
};

export function VariedadForm({ onSubmit, onClose, isSubmitting }: VariedadFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      nombre: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Producto</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Rosas" {...field} />
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
                {isSubmitting ? 'Guardando...' : 'Añadir Producto'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
