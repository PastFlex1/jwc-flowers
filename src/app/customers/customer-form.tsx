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
import type { Customer, Pais, Carguera, Vendedor, Dae } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  pais: z.string().min(1, { message: "El país es requerido." }),
  daeId: z.string().optional(),
  estadoCiudad: z.string().min(2, { message: "El estado/ciudad es requerido." }),
  address: z.string().min(10, { message: "La dirección es muy corta." }),
  email: z.string().email({ message: "Correo electrónico no válido." }),
  phone: z.string().min(7, { message: "El teléfono no es válido." }),
  agencia: z.string().min(1, { message: "La agencia es requerida." }),
  vendedor: z.string().min(1, { message: "El vendedor es requerido." }),
  plazo: z.coerce.number().refine(val => [8, 15, 30, 45].includes(val), { message: "Plazo no válido." }),
  cupo: z.coerce.number().positive({ message: "El cupo debe ser un número positivo." }),
});

type CustomerFormData = Omit<Customer, 'id'> & { id?: string };

type CustomerFormProps = {
  onSubmit: (data: CustomerFormData) => void;
  onClose: () => void;
  initialData?: Customer | null;
  paises: Pais[];
  cargueras: Carguera[];
  vendedores: Vendedor[];
  daes: Dae[];
  isSubmitting: boolean;
};

export function CustomerForm({ onSubmit, onClose, initialData, paises, cargueras, vendedores, daes, isSubmitting }: CustomerFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      plazo: Number(initialData.plazo),
      cupo: Number(initialData.cupo),
      daeId: initialData.daeId || undefined,
    } : {
      name: '',
      pais: '',
      daeId: undefined,
      estadoCiudad: '',
      address: '',
      email: '',
      phone: '',
      agencia: '',
      vendedor: '',
      plazo: 15,
      cupo: 0,
    },
  });

  useEffect(() => {
    form.reset(initialData ? {
      ...initialData,
      plazo: Number(initialData.plazo),
      cupo: Number(initialData.cupo),
      daeId: initialData.daeId || undefined,
    } : {
      name: '',
      pais: '',
      daeId: undefined,
      estadoCiudad: '',
      address: '',
      email: '',
      phone: '',
      agencia: '',
      vendedor: '',
      plazo: 15,
      cupo: 0,
    });
  }, [initialData, form]);

  function handleSubmit(values: z.infer<typeof formSchema>) {
    const dataToSubmit: CustomerFormData = {
      ...values,
      daeId: values.daeId === '__none__' ? '' : values.daeId,
      id: initialData?.id,
    };
    onSubmit(dataToSubmit);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Cliente</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Alex" {...field} />
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
                    {paises.map(p => (
                      <SelectItem key={p.id} value={p.nombre}>
                        {p.nombre}
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
            name="estadoCiudad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado/Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Pichincha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., alex@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 0991234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="agencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agencia</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una agencia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cargueras.map(c => (
                      <SelectItem key={c.id} value={c.nombreCarguera}>
                        {c.nombreCarguera}
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
            name="vendedor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendedor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un vendedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vendedores.map(v => (
                      <SelectItem key={v.id} value={v.nombre}>
                        {v.nombre}
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
            name="plazo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plazo (días)</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un plazo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[8, 15, 30, 45].map(d => (
                        <SelectItem key={d} value={String(d)}>
                          {d} días
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
            name="cupo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cupo</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="5000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="daeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DAE</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un DAE por país" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Ninguno</SelectItem>
                    {daes.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.pais} ({d.numeroDae})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Textarea placeholder="123 Main St, Anytown, USA 12345" {...field} />
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
              {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Añadir Cliente')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
