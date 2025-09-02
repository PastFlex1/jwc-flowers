
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Search, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Invoice, Finca, CreditNote, DebitNote, Payment, BunchItem } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { deleteInvoice } from '@/services/invoices';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/context/app-data-context';
import { useTranslation } from '@/context/i18n-context';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const ITEMS_PER_PAGE = 10;

export function AccountsPayableClient() {
  const { invoices, fincas, creditNotes, debitNotes, payments, refreshData } = useAppData();
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fincaMap = useMemo(() => {
    return fincas.reduce((acc, finca) => {
      acc[finca.id] = finca;
      return acc;
    }, {} as Record<string, Finca>);
  }, [fincas]);

  const notesAndPaymentsByInvoiceId = useMemo(() => {
    const result: Record<string, { credits: number; debits: number; payments: number }> = {};
    
    invoices.forEach(inv => {
      result[inv.id] = { credits: 0, debits: 0, payments: 0 };
    });

    creditNotes.forEach(note => {
      if (result[note.invoiceId]) {
        result[note.invoiceId].credits += note.amount;
      }
    });

    debitNotes.forEach(note => {
      if (result[note.invoiceId]) {
        result[note.invoiceId].debits += note.amount;
      }
    });

    payments.forEach(payment => {
      if (result[payment.invoiceId]) {
        result[payment.invoiceId].payments += payment.amount;
      }
    });

    return result;
  }, [invoices, creditNotes, debitNotes, payments]);

  const filteredInvoices = useMemo(() => {
    const purchaseInvoices = invoices.filter(inv => inv.type === 'purchase' || inv.type === 'both');
    return purchaseInvoices.filter(invoice => {
        const farmName = fincaMap[invoice.farmId]?.name || '';
        const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
        
        const searchFields = [
            invoice.invoiceNumber,
            farmName,
            invoice.status,
            format(parseISO(invoice.flightDate), 'PPP')
        ];

        return searchFields.some(field => field.toLowerCase().includes(lowerCaseSearch));
    });
  }, [invoices, debouncedSearchTerm, fincaMap]);


  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));


  const getFinca = (farmId: string): Finca | null => {
    return fincaMap[farmId] || null;
  };

  const getInvoiceBalance = (invoice: Invoice) => {
    const subtotal = invoice.items.reduce((acc, item) => {
        if (!item.bunches) return acc;
        return acc + item.bunches.reduce((bunchAcc, bunch: BunchItem) => {
            const stems = bunch.stemsPerBunch * bunch.bunchesPerBox;
            // For accounts payable, always use the purchase price
            return bunchAcc + (stems * bunch.purchasePrice);
        }, 0);
    }, 0);

    const { credits, debits, payments: totalPayments } = notesAndPaymentsByInvoiceId[invoice.id] || { credits: 0, debits: 0, payments: 0 };
    
    // For payables, credits decrease what you owe, debits increase it.
    return subtotal + debits - credits - totalPayments;
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    try {
      await deleteInvoice(invoiceToDelete.id);
      await refreshData();
      toast({ title: t('common.success'), description: "La factura de compra ha sido eliminada." });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      toast({
        title: t('common.errorDeleting'),
        description: `No se pudo eliminar la factura de compra: ${errorMessage}.`,
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
            <h2 className="text-3xl font-bold tracking-tight font-headline">Cuentas por Pagar</h2>
            <p className="text-muted-foreground">Gestiona tus facturas de compra y pagos a proveedores.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Compras</CardTitle>
            <CardDescription>Una lista de todas tus facturas de compra.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por N°, proveedor o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura #</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto Pendiente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice) => {
                    const balance = getInvoiceBalance(invoice);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          <Link href={`/invoices/${invoice.id}`} className="hover:underline text-primary">
                            {invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{getFinca(invoice.farmId)?.name || 'Desconocido'}</TableCell>
                        <TableCell>{format(parseISO(invoice.flightDate), 'PPP')}</TableCell>
                        <TableCell>${balance.toFixed(2)}</TableCell>
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
                              <Button variant="ghost" size="icon" title="Ver/Editar Factura">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Ver/Editar Factura</span>
                              </Button>
                            </Link>
                            <Link href={`/invoices/duplicate/${invoice.id}`} passHref>
                              <Button variant="ghost" size="icon" title="Duplicar Factura">
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Duplicar Factura</span>
                              </Button>
                            </Link>
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
            </div>
          </CardContent>
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la factura de compra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
