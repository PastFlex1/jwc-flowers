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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getDaes, addDae, updateDae, deleteDae } from '@/services/daes';
import type { Dae } from '@/lib/types';
import { DaeForm } from './dae-form';

type DaeFormData = Omit<Dae, 'id'> & { id?: string };

export default function DaePage() {
  const [daes, setDaes] = useState<Dae[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        title: 'Error',
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
    setIsDialogOpen(false);
    setEditingDae(null);
  };

  const handleFormSubmit = async (daeData: DaeFormData) => {
    try {
      if (daeData.id) {
        const { id, ...dataToUpdate } = daeData;
        await updateDae(id, dataToUpdate);
        toast({ title: 'Éxito', description: 'DAE actualizado correctamente.' });
      } else {
        const { id, ...dataToAdd } = daeData;
        await addDae(dataToAdd as Omit<Dae, 'id'>);
        toast({ title: 'Éxito', description: 'DAE añadido correctamente.' });
      }
      handleCloseDialog();
      fetchDaes();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el DAE.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (dae: Dae) => {
    setDaeToDelete(dae);
  };

  const handleDeleteConfirm = async () => {
    if (daeToDelete) {
      try {
        await deleteDae(daeToDelete.id);
        toast({ title: 'Éxito', description: 'DAE eliminado correctamente.' });
        setDaeToDelete(null);
        fetchDaes();
      } catch (error) {
        console.error("Error deleting DAE:", error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el DAE.',
          variant: 'destructive',
        });
      }
    }
  };

  const renderSkeleton = () => (
    Array.from({ length: 3 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell className="text-right space-x-0">
          <Skeleton className="h-8 w-8 inline-block" />
          <Skeleton className="h-8 w-8 inline-block ml-2" />
        </TableCell>
      </TableRow>
    ))
  );

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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              e.preventDefault();
            }}>
            <DialogHeader>
              <DialogTitle>{editingDae ? 'Editar DAE' : 'Añadir Nuevo DAE'}</DialogTitle>
            </DialogHeader>
            <DaeForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingDae}
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
                {isLoading ? renderSkeleton() : daes.map((dae) => (
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
