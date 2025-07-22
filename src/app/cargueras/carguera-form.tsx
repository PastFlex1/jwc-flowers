'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Carguera } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  nombreCarguera: z.string().min(2, { message: "The name must be at least 2 characters." }),
  pais: z.string().min(1, { message: "Please select a country." }),
});

type CargueraFormData = Omit<Carguera, 'id'> & { id?: string };

type CargueraFormProps = {
  onSubmit: (data: CargueraFormData) => void;
  onClose: () => void;
  initialData?: Carguera | null;
  isSubmitting: boolean;
};

export function CargueraForm({ onSubmit, onClose, initialData, isSubmitting }: CargueraFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
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
              <FormLabel>Carrier Name</FormLabel>
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
              <FormLabel>Country</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="International">International</SelectItem>
                    <SelectItem value="National">National</SelectItem>
                  </SelectContent>
                </Select>
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
                {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Carrier')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
