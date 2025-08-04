'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Paperclip } from 'lucide-react';
import type { Customer, Invoice } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  to: z.string().email('Invalid email address.'),
  invoiceIds: z.array(z.string()).min(1, 'You must select at least one document to send.'),
});

type SendDocumentsDialogProps = {
  customer: Customer | null;
  invoices: Invoice[];
  isOpen: boolean;
  onClose: () => void;
};

export default function SendDocumentsDialog({ customer, invoices, isOpen, onClose }: SendDocumentsDialogProps) {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });
  
  const allInvoiceIds = invoices.map(inv => inv.id);

  useEffect(() => {
    if (customer && isOpen) {
      form.reset({
        to: customer.email,
        invoiceIds: allInvoiceIds,
      });
      setError(null);
    }
  }, [customer, isOpen, form, allInvoiceIds]);
  
  if (!customer) {
    return null;
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSending(true);
    setError(null);

    const subject = `Documentos para ${customer.name}`;
    const body = `Estimado/a ${customer.name},\n\nAdjunto encontrará los documentos solicitados.\n\nGracias,\nEl equipo de JCW Flowers`;
    
    try {
        const response = await fetch('/api/send-invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: values.to,
                subject: subject,
                body: body,
                invoiceIds: values.invoiceIds,
                isStatement: true,
                statementData: { customer, invoices }
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to send email.');
        }

        toast({
            title: "Correo Enviado",
            description: `Se han enviado ${values.invoiceIds.length} documentos a ${values.to}.`,
        });
        onClose();
        
    } catch (e: any) {
        const errorMessage = e.message || 'An unknown error occurred.';
        setError(errorMessage);
        toast({
            title: "Error al Enviar",
            description: errorMessage,
            variant: "destructive",
        });
    }


    setIsSending(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={!isSending ? onClose : () => {}}>
      <DialogContent className="sm:max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Enviar Documentos por Correo</DialogTitle>
              <DialogDescription>
                Seleccione los documentos para enviar a {customer.name}.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive" className="my-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Para</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                   <FormLabel>Archivos Adjuntos</FormLabel>
                   <FormField
                      control={form.control}
                      name="invoiceIds"
                      render={() => (
                        <Card>
                            <CardContent className="p-4">
                               <ScrollArea className="h-64">
                                <div className="space-y-2">
                                   <div className="flex items-center space-x-2 p-2 rounded-md transition-colors hover:bg-muted/50">
                                      <Checkbox
                                        id="select-all"
                                        checked={form.getValues('invoiceIds')?.length === allInvoiceIds.length}
                                        onCheckedChange={(checked) => {
                                           form.setValue('invoiceIds', checked ? allInvoiceIds : [], { shouldValidate: true });
                                        }}
                                      />
                                      <label htmlFor="select-all" className="font-medium">
                                        Seleccionar todo
                                      </label>
                                  </div>
                                  {invoices.map((invoice) => (
                                    <FormField
                                        key={invoice.id}
                                        control={form.control}
                                        name="invoiceIds"
                                        render={({ field }) => (
                                          <FormItem className="flex flex-row items-center space-x-2 space-y-0 p-2 rounded-md transition-colors hover:bg-muted/50">
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(invoice.id)}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? field.onChange([...(field.value || []), invoice.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                          (value) => value !== invoice.id
                                                        )
                                                      )
                                                }}
                                              />
                                            </FormControl>
                                            <FormLabel className="font-normal w-full cursor-pointer">
                                              <div className="flex justify-between items-center">
                                                <span>Factura-{invoice.invoiceNumber}.pdf</span>
                                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                              </div>
                                            </FormLabel>
                                          </FormItem>
                                        )}
                                      />
                                  ))}
                                </div>
                               </ScrollArea>
                            </CardContent>
                        </Card>
                      )}
                    />
                    <FormMessage>{form.formState.errors.invoiceIds?.message}</FormMessage>
                </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSending ? 'Enviando...' : `Enviar ${form.watch('invoiceIds')?.length || 0} Documentos`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
