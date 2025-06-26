
'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { getMarcaciones, addMarcacion, updateMarcacion, deleteMarcacion } from '@/services/marcaciones';
import type { Marcacion } from '@/lib/types';
import { MarcacionForm } from './marcacion-form';

type MarcacionFormData = Omit<Marcacion, 'id'> & { id?: string };

export function MarcacionClient() {
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMarcacion, setEditingMarcacion] = useState<Marcacion | null>(null);
  const [marcacionToDelete, setMarcacionToDelete] = useState<Marcacion | null>(null);
  const { toast } = useToast();

  const fetchMarcaciones = useCallback(async () => {
    try {
      const data = await getMarcaciones();
      setMarcaciones(data);
    } catch (error) {
      console.error("Error fetching marcaciones:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar las marcaciones. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  useEffect(() => {
    fetchMarcaciones();
  }, [fetchMarcaciones]);

  const handleOpenDialog = (marcacion: Marcacion | null = null) => {
    setEditingMarcacion(marcacion);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMarcacion(null);
  };

  const handleFormSubmit = async (marcacionData: MarcacionFormData) => {
    handleCloseDialog();

    if (marcacionData.id) {
      const originalMarcaciones = [...marcaciones];
      const updatedMarcacion = marcacionData as Marcacion;
      setMarcaciones(prev => prev.map(m => m.id === updatedMarcacion.id ? updatedMarcacion : m));
      
      try {
        await updateMarcacion(updatedMarcacion.id, updatedMarcacion);
        toast({ title: 'Éxito', description: 'Marcación actualizada correctamente.' });
      } catch (error) {
        setMarcaciones(originalMarcaciones);
        console.error("Error updating marcacion:", error);
        toast({
          title: 'Error de Actualización',
          description: 'No se pudo actualizar la marcación. Verifique sus reglas de seguridad de Firestore.',
          variant: 'destructive',
        });
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      const newMarcacion = { ...marcacionData, id: tempId } as Marcacion;
      setMarcaciones(prev => [...prev, newMarcacion]);
      
      try {
        const newId = await addMarcacion(marcacionData as Omit<Marcacion, 'id'>);
        setMarcaciones(prev => prev.map(m => m.id === tempId ? { ...newMarcacion, id: newId } : m));
        toast({ title: 'Éxito', description: 'Marcación añadida correctamente.' });
      } catch (error) {
        setMarcaciones(prev => prev.filter(m => m.id !== tempId));
        console.error("Error adding marcacion:", error);
        toast({
          title: 'Error al Añadir',
          description: 'No se pudo guardar la marcación. Verifique sus reglas de seguridad de Firestore.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteClick = (marcacion: Marcacion) => {
    setMarcacionToDelete(marcacion);
  };

  const handleDeleteConfirm = async () => {
    if (!marcacionToDelete) return;

    const originalMarcaciones = [...marcaciones];
    const idToDelete = marcacionToDelete.id;

    setMarcaciones(prev => prev.filter(m => m.id !== idToDelete));
    setMarcacionToDelete(null);

    try {
      await deleteMarcacion(idToDelete);
      toast({ title: 'Éxito', description: 'Marcación eliminada correctamente.' });
    } catch (error) {
      setMarcaciones(originalMarcaciones);
      console.error("Error deleting marcación:", error);
      toast({
        title: 'Error al Eliminar',
        description: 'No se pudo eliminar la marcación. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              e.preventDefault();
            }}>
            <DialogHeader>
              <DialogTitle>{editingMarcacion ? 'Editar Marcación' : 'Añadir Nueva Marcación'}</DialogTitle>
            </DialogHeader>
            <MarcacionForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingMarcacion}
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
                {marcaciones.map((marcacion) => (
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
