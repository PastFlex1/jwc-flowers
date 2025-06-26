'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Consignatario, Pais } from '@/lib/types';

const formSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  pais: z.string().min(1, { message: "Por favor seleccione un país." }),
});

type ConsignatarioFormData = Omit<Consignatario, 'id'> & { id?: string };

type ConsignatarioFormProps = {
  onSubmit: (data: ConsignatarioFormData) => void;
  onClose: () => void;
  initialData?: Consignatario | null;
  paises: Pais[];
};

export function ConsignatarioForm({ onSubmit, onClose, initialData, paises }: ConsignatarioFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nombre: '',
      pais: '',
    },
  });

  useEffect(() => {
    form.reset(initialData || {
      nombre: '',
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
          name="nombre"
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
                {initialData ? 'Guardar Cambios' : 'Añadir Consignatario'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
