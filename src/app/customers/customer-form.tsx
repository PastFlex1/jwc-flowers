
'use client';

import { useEffect, useMemo } from 'react';
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
  type: z.enum(['National', 'International'], { required_error: "Type is required." }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  cedula: z.string().min(1, { message: "ID/RUC is required."}),
  pais: z.string().min(1, { message: "Country is required." }),
  daeId: z.string().optional(),
  estadoCiudad: z.string().min(2, { message: "State/City is required." }),
  address: z.string().min(10, { message: "Address is too short." }),
  email: z.string().email({ message: "Invalid email." }),
  phone: z.string().min(7, { message: "Invalid phone number." }),
  agencia: z.string().min(1, { message: "Agency is required." }),
  vendedor: z.string().min(1, { message: "Seller is required." }),
  plazo: z.coerce.number().refine(val => [8, 15, 30, 45].includes(val), { message: "Invalid term." }),
  cupo: z.coerce.number().positive({ message: "Credit limit must be a positive number." }),
}).refine(data => {
    if (data.type === 'National') {
        if (data.cedula.length === 10) {
            return /^\d{10}$/.test(data.cedula);
        }
        if (data.cedula.length === 13) {
            return /^\d{10}001$/.test(data.cedula);
        }
        return false;
    }
    return true;
}, {
    message: "For National customers, ID must be 10 digits or RUC must be 13 digits and end in 001.",
    path: ['cedula'],
}).refine(data => {
    if (data.type === 'International') {
        return data.cedula === '1234567890' || data.cedula === '8888888888888';
    }
    return true;
}, {
    message: "For International customers, ID must be '1234567890' or '8888888888888'.",
    path: ['cedula'],
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
    mode: 'onChange',
    defaultValues: initialData ? {
      ...initialData,
      plazo: Number(initialData.plazo),
      cupo: Number(initialData.cupo),
      daeId: initialData.daeId || "__none__",
    } : {
      type: 'National',
      name: '',
      cedula: '',
      pais: 'Ecuador',
      daeId: "__none__",
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

  const selectedPais = form.watch('pais');
  const customerType = form.watch('type');

  const filteredPaises = useMemo(() => {
    if (customerType === 'International') {
        return paises.filter(p => p.nombre !== 'Ecuador');
    }
    return paises;
  }, [paises, customerType]);


  useEffect(() => {
    if (customerType === 'International') {
        if (form.getValues('cedula') === '' || form.getValues('cedula').length < 10) {
            form.setValue('cedula', '1234567890');
        }
        if (form.getValues('pais') === 'Ecuador') {
            form.setValue('pais', '');
        }
    } else if (customerType === 'National') {
        if (form.getValues('cedula') === '1234567890' || form.getValues('cedula') === '8888888888888') {
            form.setValue('cedula', '');
        }
        form.setValue('pais', 'Ecuador');
    }
  }, [customerType, form]);


  useEffect(() => {
    if (selectedPais) {
      const correspondingDae = daes.find(d => d.pais === selectedPais);
      if (correspondingDae) {
        form.setValue('daeId', correspondingDae.id, { shouldValidate: true });
      } else {
        form.setValue('daeId', "__none__", { shouldValidate: true });
      }
    } else {
        form.setValue('daeId', "__none__", { shouldValidate: true });
    }
  }, [selectedPais, daes, form]);

  useEffect(() => {
    form.reset(initialData ? {
      ...initialData,
      plazo: Number(initialData.plazo),
      cupo: Number(initialData.cupo),
      daeId: initialData.daeId || "__none__",
    } : {
      type: 'National',
      name: '',
      cedula: '',
      pais: 'Ecuador',
      daeId: "__none__",
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
      type: values.type,
      daeId: values.daeId === '__none__' ? '' : values.daeId,
    };
    if (initialData?.id) {
        dataToSubmit.id = initialData.id;
    }
    onSubmit(dataToSubmit);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el tipo de cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="National">Nacional</SelectItem>
                    <SelectItem value="International">Internacional</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Alex" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="cedula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID / RUC</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1712345678" {...field} />
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
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={customerType === 'National'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredPaises.map(p => (
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
                <FormLabel>State/City</FormLabel>
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
                <FormLabel>Email</FormLabel>
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
                <FormLabel>Phone</FormLabel>
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
                <FormLabel>Agency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agency" />
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
                <FormLabel>Seller</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a seller" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vendedores.map(v => (
                      <SelectItem key={v.id} value={v.id}>
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
                <FormLabel>Term (days)</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a term" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[8, 15, 30, 45].map(d => (
                        <SelectItem key={d} value={String(d)}>
                          {d} days
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
                <FormLabel>Credit Limit</FormLabel>
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
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedPais}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedPais ? "Select a DAE" : "Select a country first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {daes.map(d => (
                      <SelectItem key={d.id} value={d.id} disabled={selectedPais && d.pais !== selectedPais}>
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
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="123 Main St, Anytown, USA 12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Customer')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
