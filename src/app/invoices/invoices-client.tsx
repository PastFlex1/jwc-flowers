'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
import type { Invoice, Customer, CreditNote } from '@/lib/types';
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

export function InvoicesClient() {
  const { invoices, customers, creditNotes, refreshData } = useAppData();
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { t } = useTranslation();

  const customerMap = useMemo(() => {
    return customers.reduce((acc, customer) => {
      acc[customer.id] = customer;
      return acc;
    }, {} as Record<string, Customer>);
  }, [customers]);

  const creditNotesByInvoiceId = useMemo(() => {
    return creditNotes.reduce((acc, note) => {
      if (!acc[note.invoiceId]) {
        acc[note.invoiceId] = [];
      }
      acc[note.invoiceId].push(note);
      return acc;
    }, {} as Record<string, CreditNote[]>);
  }, [creditNotes]);

  useEffect(() => {
    const filtered = invoices.filter(invoice => {
        const customerName = customerMap[invoice.customerId]?.name || '';
        const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
        
        const searchFields = [
            invoice.invoiceNumber,
            customerName,
            invoice.status,
            format(parseISO(invoice.flightDate), 'PPP')
        ];

        return searchFields.some(field => field.toLowerCase().includes(lowerCaseSearch));
    });
    setLocalInvoices(filtered);
    setCurrentPage(1);
  }, [invoices, debouncedSearchTerm, customerMap]);

  const totalPages = Math.ceil(localInvoices.length / ITEMS_PER_PAGE);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return localInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [localInvoices, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));


  const getCustomer = (customerId: string): Customer | null => {
    return customerMap[customerId] || null;
  };

  const getInvoiceTotal = (invoice: Invoice) => {
    const subtotal = invoice.items.reduce((total, item) => {
      const totalStems = (item.stemCount || 0) * (item.bunchesPerBox || 0);
      const itemTotal = (item.salePrice || 0) * totalStems;
      return total + itemTotal;
    }, 0);
    const tax = subtotal * 0.12; // Assuming 12% tax, adjust if needed
    const totalWithTax = subtotal + tax;
    
    const creditsForInvoice = creditNotesByInvoiceId[invoice.id] || [];
    const totalCreditAmount = creditsForInvoice.reduce((sum, note) => sum + note.amount, 0);

    return totalWithTax - totalCreditAmount;
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
      toast({ title: t('common.success'), description: t('invoices.toast.deleted') });
      await refreshData();
    } catch (error) {
      setLocalInvoices(originalInvoices);
      console.error("Error deleting invoice:", error);
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      toast({
        title: t('common.errorDeleting'),
        description: t('invoices.toast.deleteError', { error: errorMessage }),
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
            <h2 className="text-3xl font-bold tracking-tight font-headline">{t('invoices.title')}</h2>
            <p className="text-muted-foreground">{t('invoices.description')}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('invoices.history')}</CardTitle>
            <CardDescription>{t('invoices.historyDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('invoices.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoices.invoiceNumber')}</TableHead>
                  <TableHead>{t('invoices.customer')}</TableHead>
                  <TableHead>{t('invoices.flightDate')}</TableHead>
                  <TableHead>{t('invoices.amount')}</TableHead>
                  <TableHead>{t('invoices.status')}</TableHead>
                  <TableHead className="text-right">{t('invoices.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice) => {
                  const total = getInvoiceTotal(invoice);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline text-primary">
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{getCustomer(invoice.customerId)?.name || t('invoices.unknownCustomer')}</TableCell>
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
                            <Button variant="ghost" size="icon" title={t('invoices.editTooltip')}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">{t('invoices.editTooltip')}</span>
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(invoice)} title={t('invoices.deleteTooltip')}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">{t('invoices.deleteTooltip')}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
          {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('common.page', { currentPage: currentPage, totalPages: totalPages })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                >
                  {t('common.next')}
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
              {t('invoices.confirmDeleteDescription')}
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
