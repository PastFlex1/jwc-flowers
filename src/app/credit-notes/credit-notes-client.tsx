'use client';

import { useState, useMemo } from 'react';
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
import { addCreditNote, deleteCreditNote } from '@/services/credit-notes';
import type { CreditNote } from '@/lib/types';
import { CreditNoteForm } from './credit-note-form';
import { useAppData } from '@/context/app-data-context';
import { useTranslation } from '@/context/i18n-context';
import { format, parseISO } from 'date-fns';

type CreditNoteFormData = Omit<CreditNote, 'id'>;

const ITEMS_PER_PAGE = 10;

export function CreditNotesClient() {
  const { creditNotes, invoices, refreshData } = useAppData();
  const [localCreditNotes, setLocalCreditNotes] = useState<CreditNote[]>([]);
  const { t } = useTranslation();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<CreditNote | null>(null);
  const { toast } = useToast();

  useState(() => {
    setLocalCreditNotes(creditNotes);
    setCurrentPage(1);
  });
  
  const totalPages = Math.ceil(localCreditNotes.length / ITEMS_PER_PAGE);

  const paginatedNotes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return localCreditNotes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [localCreditNotes, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
  };

  const handleFormSubmit = async (formData: CreditNoteFormData) => {
    setIsSubmitting(true);
    handleCloseDialog();
    
    try {
      await addCreditNote(formData);
      toast({ title: 'Éxito', description: 'Nota de crédito añadida correctamente.' });
      await refreshData();
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar la nota de crédito: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (note: CreditNote) => {
    setNoteToDelete(note);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    
    const originalNotes = [...localCreditNotes];
    setLocalCreditNotes(prev => prev.filter(c => c.id !== noteToDelete.id));
    
    try {
      await deleteCreditNote(noteToDelete.id);
      toast({ title: 'Éxito', description: 'Nota de crédito eliminada correctamente.' });
      await refreshData();
    } catch (error) {
      setLocalCreditNotes(originalNotes);
      console.error("Error deleting note:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar la nota de crédito: ${errorMessage}.`,
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
            <h2 className="text-3xl font-bold tracking-tight font-headline">Notas de Crédito</h2>
            <p className="text-muted-foreground">Gestiona las notas de crédito para tus facturas.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Nota de Crédito
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Añadir Nueva Nota de Crédito</DialogTitle>
            </DialogHeader>
            <CreditNoteForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              isSubmitting={isSubmitting}
              invoices={invoices}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Notas de Crédito</CardTitle>
            <CardDescription>Un listado de todas tus notas de crédito.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Nº Factura</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Razón</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
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

      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la nota de crédito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
