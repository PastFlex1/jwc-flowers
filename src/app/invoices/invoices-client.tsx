'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Edit, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import type { Invoice } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { deleteInvoice } from '@/services/invoices';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/context/app-data-context';

export function InvoicesClient() {
  const { invoices, customers, refreshData } = useAppData();
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLocalInvoices(invoices);
  }, [invoices]);

  const customerMap = useMemo(() => {
    return customers.reduce((acc, customer) => {
      acc[customer.id] = customer.name;
      return acc;
    }, {} as Record<string, string>);
  }, [customers]);

  const getCustomerName = (customerId: string) => {
    return customerMap[customerId] || 'Cliente Desconocido';
  };

  const getInvoiceTotal = (invoice: Invoice) => {
    if (!invoice.items) return 0;
    const subtotal = invoice.items.reduce((total, item) => {
      const itemTotal = (item.salePrice || 0) * (item.stemCount || 0);
      return total + itemTotal;
    }, 0);
    const tax = subtotal * 0.12;
    return subtotal + tax;
  };

  const handleSendEmailClick = (invoice: Invoice) => {
    toast({
      title: 'Funcionalidad en desarrollo',
      description: `Enviar la factura ${invoice.invoiceNumber} por correo aún no está implementado.`,
    });
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;

    const originalInvoices = [...localInvoices];
    setLocalInvoices(prev => prev.filter(i => i.id !== invoiceToDelete.id));

    try {
      await deleteInvoice(invoiceToDelete.id);
      toast({ title: 'Éxito', description: 'Factura eliminada correctamente.' });
      await refreshData();
    } catch (error) {
      setLocalInvoices(originalInvoices);
      console.error("Error deleting invoice:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar la factura: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setInvoiceToDelete(null);
    }
  };


  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Invoices</h2>
            <p className="text-muted-foreground">Manage and track your customer invoices.</p>
          </div>
          <Link href="/invoices/new" passHref>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>A list of all your past and present invoices.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Flight Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localInvoices.map((invoice) => {
                  const total = getInvoiceTotal(invoice);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline text-primary">
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
                      <TableCell>{format(parseISO(invoice.flightDate), 'PPP')}</TableCell>
                      <TableCell>${total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={invoice.status === 'Paid' ? 'secondary' : invoice.status === 'Overdue' ? 'destructive' : 'outline'}
                          className={cn({
                            'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': invoice.status === 'Paid',
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': invoice.status === 'Pending',
                          })}
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/invoices/${invoice.id}`} passHref>
                            <Button variant="ghost" size="icon" title="Editar Factura">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar Factura</span>
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => handleSendEmailClick(invoice)} title="Enviar por Correo">
                            <Mail className="h-4 w-4" />
                            <span className="sr-only">Enviar por Correo</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(invoice)} title="Eliminar Factura">
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Eliminar Factura</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la factura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
