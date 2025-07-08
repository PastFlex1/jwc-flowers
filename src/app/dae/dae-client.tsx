'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { addDae, updateDae, deleteDae } from '@/services/daes';
import type { Dae } from '@/lib/types';
import { DaeForm } from './dae-form';
import { useAppData } from '@/context/app-data-context';
import { useTranslation } from '@/context/i18n-context';

type DaeFormData = Omit<Dae, 'id'> & { id?: string };

const ITEMS_PER_PAGE = 10;

export function DaeClient() {
  const { daes, paises, refreshData } = useAppData();
  const [localDaes, setLocalDaes] = useState<Dae[]>([]);
  const { t } = useTranslation();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDae, setEditingDae] = useState<Dae | null>(null);
  const [daeToDelete, setDaeToDelete] = useState<Dae | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLocalDaes(daes);
    setCurrentPage(1);
  }, [daes]);

  const totalPages = Math.ceil(localDaes.length / ITEMS_PER_PAGE);

  const paginatedDaes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return localDaes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [localDaes, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleOpenDialog = (dae: Dae | null = null) => {
    setEditingDae(dae);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingDae(null);
  };

  const handleFormSubmit = async (daeData: DaeFormData) => {
    setIsSubmitting(true);
    const originalData = [...localDaes];

    if (daeData.id) {
        setLocalDaes(prev => prev.map(d => d.id === daeData.id ? { ...d, ...daeData } as Dae : d));
    } else {
        const tempId = `temp-${Date.now()}`;
        setLocalDaes(prev => [...prev, { ...daeData, id: tempId } as Dae]);
    }
    
    handleCloseDialog();
    
    try {
      if (daeData.id) {
        await updateDae(daeData.id, daeData as Dae);
        toast({ title: 'Éxito', description: 'DAE actualizado correctamente.' });
      } else {
        await addDae(daeData as Omit<Dae, 'id'>);
        toast({ title: 'Éxito', description: 'DAE añadido correctamente.' });
      }
      await refreshData();
    } catch (error) {
      setLocalDaes(originalData); // Revert
      console.error("Error submitting DAE:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar el DAE: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (dae: Dae) => {
    setDaeToDelete(dae);
  };

  const handleDeleteConfirm = async () => {
    if (!daeToDelete) return;

    const originalData = [...localDaes];
    setLocalDaes(prev => prev.filter(d => d.id !== daeToDelete.id));

    try {
      await deleteDae(daeToDelete.id);
      toast({ title: 'Éxito', description: 'DAE eliminado correctamente.' });
      await refreshData();
    } catch (error) {
      setLocalDaes(originalData);
      console.error("Error deleting DAE:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar el DAE: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
        setDaeToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">{t('dae.title')}</h2>
            <p className="text-muted-foreground">{t('dae.description')}</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> {t('dae.add')}
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDae ? 'Editar DAE' : 'Añadir Nuevo DAE'}</DialogTitle>
            </DialogHeader>
            <DaeForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingDae}
              isSubmitting={isSubmitting}
              paises={paises}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de DAEs</CardTitle>
            <CardDescription>Un listado de todos tus DAEs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>País</TableHead>
                  <TableHead>Número de DAE</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDaes.map((dae) => (
                  <TableRow key={dae.id}>
                    <TableCell className="font-medium">{dae.pais}</TableCell>
                    <TableCell>{dae.numeroDae}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(dae)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(dae)}>
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

      <AlertDialog open={!!daeToDelete} onOpenChange={(open) => !open && setDaeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el DAE.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDaeToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
