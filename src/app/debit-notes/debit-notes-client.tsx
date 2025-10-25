
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import type { DebitNote } from '@/lib/types';
import { DebitNoteForm } from './debit-note-form';
import { useAppData } from '@/context/app-data-context';
import { useTranslation } from '@/context/i18n-context';
import { format, parseISO } from 'date-fns';
import { DemoLimitDialog } from '@/components/ui/demo-limit-dialog';

type DebitNoteFormData = Omit<DebitNote, 'id'>;

const ITEMS_PER_PAGE = 10;

export function DebitNotesClient() {
  const { debitNotes, invoices, refreshData, addDebitNote, deleteDebitNote } = useAppData();
  const [localDebitNotes, setLocalDebitNotes] = useState<DebitNote[]>([]);
  const { t } = useTranslation();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<DebitNote | null>(null);
  const [isDemoLimitDialogOpen, setIsDemoLimitDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalDebitNotes(debitNotes);
    setCurrentPage(1);
  }, [debitNotes]);
  
  const totalPages = Math.ceil(localDebitNotes.length / ITEMS_PER_PAGE);

  const paginatedNotes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return localDebitNotes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [localDebitNotes, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
  };

  const handleFormSubmit = async (formData: DebitNoteFormData) => {
    setIsSubmitting(true);
    
    try {
      await addDebitNote(formData);
      toast({ title: t('common.success'), description: t('debitNotes.toast.added') });
      await refreshData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Límite de demostración alcanzado')) {
        setIsDemoLimitDialogOpen(true);
      } else {
        toast({
          title: t('common.errorSaving'),
          description: t('debitNotes.toast.error', { error: errorMessage }),
          variant: 'destructive',
          duration: 10000,
        });
      }
    } finally {
      setIsSubmitting(false);
      handleCloseDialog();
    }
  };

  const handleDeleteClick = (note: DebitNote) => {
    setNoteToDelete(note);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    
    try {
      await deleteDebitNote(noteToDelete.id);
      await refreshData();
      toast({ title: t('common.success'), description: t('debitNotes.toast.deleted') });
    } catch (error) {
      console.error("Error deleting note:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: t('common.errorDeleting'),
        description: t('debitNotes.toast.deleteError', { error: errorMessage }),
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setNoteToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">{t('debitNotes.title')}</h2>
            <p className="text-muted-foreground">{t('debitNotes.description')}</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> {t('debitNotes.add')}
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('debitNotes.addTitle')}</DialogTitle>
            </DialogHeader>
            <DebitNoteForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              isSubmitting={isSubmitting}
              invoices={invoices}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>{t('debitNotes.list.title')}</CardTitle>
            <CardDescription>{t('debitNotes.list.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('debitNotes.list.date')}</TableHead>
                  <TableHead>{t('debitNotes.list.invoice')}</TableHead>
                  <TableHead>{t('debitNotes.list.amount')}</TableHead>
                  <TableHead>{t('debitNotes.list.reason')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>{format(parseISO(note.date), 'PPP')}</TableCell>
                    <TableCell className="font-medium">{note.invoiceNumber}</TableCell>
                    <TableCell>${note.amount.toFixed(2)}</TableCell>
                    <TableCell>{note.reason}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(note)}>
                           <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('debitNotes.confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DemoLimitDialog isOpen={isDemoLimitDialogOpen} onClose={() => setIsDemoLimitDialogOpen(false)} />
    </>
  );
}
