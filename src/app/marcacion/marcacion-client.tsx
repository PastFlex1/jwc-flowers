'use client';

import { useState, useEffect } from 'react';
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
import { addMarcacion, updateMarcacion, deleteMarcacion } from '@/services/marcaciones';
import type { Marcacion } from '@/lib/types';
import { MarcacionForm } from './marcacion-form';
import { useAppData } from '@/context/app-data-context';

type MarcacionFormData = Omit<Marcacion, 'id'> & { id?: string };

export function MarcacionClient() {
  const { marcaciones, refreshData } = useAppData();
  const [localMarcaciones, setLocalMarcaciones] = useState<Marcacion[]>([]);
  
  useEffect(() => {
    setLocalMarcaciones(marcaciones);
  }, [marcaciones]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMarcacion, setEditingMarcacion] = useState<Marcacion | null>(null);
  const [marcacionToDelete, setMarcacionToDelete] = useState<Marcacion | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (marcacion: Marcacion | null = null) => {
    setEditingMarcacion(marcacion);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingMarcacion(null);
  };

  const handleFormSubmit = async (marcacionData: MarcacionFormData) => {
    setIsSubmitting(true);
    const originalData = [...localMarcaciones];

    if (marcacionData.id) {
        setLocalMarcaciones(prev => prev.map(m => m.id === marcacionData.id ? { ...m, ...marcacionData } as Marcacion : m));
    } else {
        const tempId = `temp-${Date.now()}`;
        setLocalMarcaciones(prev => [...prev, { ...marcacionData, id: tempId } as Marcacion]);
    }

    handleCloseDialog();

    try {
      if (marcacionData.id) {
        await updateMarcacion(marcacionData.id, marcacionData as Marcacion);
        toast({ title: 'Éxito', description: 'Marcación actualizada correctamente.' });
      } else {
        await addMarcacion(marcacionData as Omit<Marcacion, 'id'>);
        toast({ title: 'Éxito', description: 'Marcación añadida correctamente.' });
      }
      await refreshData();
    } catch (error) {
      setLocalMarcaciones(originalData); // Revert
      console.error("Error submitting marcacion:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar la marcación: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (marcacion: Marcacion) => {
    setMarcacionToDelete(marcacion);
  };

  const handleDeleteConfirm = async () => {
    if (!marcacionToDelete) return;

    const originalData = [...localMarcaciones];
    setLocalMarcaciones(prev => prev.filter(m => m.id !== marcacionToDelete.id));

    try {
      await deleteMarcacion(marcacionToDelete.id);
      toast({ title: 'Éxito', description: 'Marcación eliminada correctamente.' });
      await refreshData();
    } catch (error) {
      setLocalMarcaciones(originalData);
      console.error("Error deleting marcación:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar la marcación: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setMarcacionToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Marcación</h2>
            <p className="text-muted-foreground">Administra las marcaciones.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Marcación
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingMarcacion ? 'Editar Marcación' : 'Añadir Nueva Marcación'}</DialogTitle>
            </DialogHeader>
            <MarcacionForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingMarcacion}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Marcaciones</CardTitle>
            <CardDescription>Un listado de todas tus marcaciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Marcación</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localMarcaciones.map((marcacion) => (
                  <TableRow key={marcacion.id}>
                    <TableCell className="font-medium">{marcacion.numeroMarcacion}</TableCell>
                    <TableCell>{marcacion.cliente}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(marcacion)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(marcacion)}>
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

      <AlertDialog open={!!marcacionToDelete} onOpenChange={(open) => !open && setMarcacionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la marcación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMarcacionToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
