'use client';

import { useState, useEffect, useTransition } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import type { Invoice, Customer } from '@/lib/types';
import { useTranslation } from '@/context/i18n-context';
import { sendDocumentsAction } from '@/app/account-statement/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  to: z.string().email('Invalid email address.'),
  subject: z.string().min(1, 'Subject is required.'),
  body: z.string(),
});

type SendInvoiceDialogProps = {
  invoice: Invoice | null;
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
};

export function SendInvoiceDialog({ invoice, customer, isOpen, onClose }: SendInvoiceDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (customer && invoice && isOpen) {
      form.reset({
        to: customer.email,
        subject: t('sendInvoiceDialog.defaultSubject', { invoiceNumber: invoice.invoiceNumber }),
        body: t('sendInvoiceDialog.defaultBody', { customerName: customer.name }),
      });
      setError(null);
    }
  }, [customer, invoice, isOpen, form, t]);
  
  if (!invoice || !customer) {
    return null;
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setError(null);
    startTransition(async () => {
      const result = await sendDocumentsAction({
        ...values,
        invoiceIds: [invoice.id],
      });

      if (result.success) {
        toast({
          title: t('sendInvoiceDialog.successTitle'),
          description: t('sendInvoiceDialog.successDescription', { invoiceNumber: invoice.invoiceNumber, email: values.to }),
        });
        onClose();
      } else {
        setError(result.error);
        toast({
          title: "Error al Enviar",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={!isPending ? onClose : () => {}}>
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{t('sendInvoiceDialog.title')}</DialogTitle>
              <DialogDescription>
                {t('sendInvoiceDialog.description', { invoiceNumber: invoice.invoiceNumber, customerName: customer.name })}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive" className="my-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="py-6 space-y-4">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sendInvoiceDialog.to')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sendInvoiceDialog.subject')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sendInvoiceDialog.body')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                {t('sendInvoiceDialog.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isPending ? t('sendInvoiceDialog.sending') : t('sendInvoiceDialog.send')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
