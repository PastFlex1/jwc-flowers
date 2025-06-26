'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { addDae, updateDae, deleteDae, getDaes } from '@/services/daes';
import type { Dae } from '@/lib/types';
import { DaeForm } from './dae-form';

type DaeFormData = Omit<Dae, 'id'> & { id?: string };

export function DaeClient() {
  const [daes, setDaes] = useState<Dae[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDae, setEditingDae] = useState<Dae | null>(null);
  const [daeToDelete, setDaeToDelete] = useState<Dae | null>(null);
  const { toast } = useToast();

  const fetchDaes = useCallback(async () => {
    setIsLoading(true);
    try {
      const daesData = await getDaes();
      setDaes(daesData);
    } catch (error) {
       console.error("Error fetching DAEs:", error);
       toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar los DAEs.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDaes();
  }, [fetchDaes]);

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
    const originalData = [...daes];

    if (daeData.id) {
        setDaes(prev => prev.map(d => d.id === daeData.id ? { ...d, ...daeData } as Dae : d));
    } else {
        const tempId = `temp-${Date.now()}`;
        setDaes(prev => [...prev, { ...daeData, id: tempId } as Dae]);
    }
    
    handleCloseDialog();
    
    try {
      if (daeData.id) {
        await updateDae(daeData.id, daeData as Dae);
        toast({ title: 'Éxito', description: 'DAE actualizado correctamente.' });
      } else {
        const newId = await addDae(daeData as Omit<Dae, 'id'>);
        setDaes(prev => prev.map(d => d.id.startsWith('temp-') ? { ...d, id: newId } : d));
        toast({ title: 'Éxito', description: 'DAE añadido correctamente.' });
      }
      await fetchDaes(); // Re-sync
    } catch (error) {
      setDaes(originalData); // Revert
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

    const originalData = [...daes];
    setDaes(prev => prev.filter(d => d.id !== daeToDelete.id));

    try {
      await deleteDae(daeToDelete.id);
      toast({ title: 'Éxito', description: 'DAE eliminado correctamente.' });
    } catch (error) {
      setDaes(originalData);
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
            <h2 className="text-3xl font-bold tracking-tight font-headline">DAE</h2>
            <p className="text-muted-foreground">Administra los DAEs.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir DAE
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
                {daes.map((dae) => (
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
