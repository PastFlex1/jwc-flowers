
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
import { getCargueras, addCarguera, updateCarguera, deleteCarguera } from '@/services/cargueras';
import type { Carguera } from '@/lib/types';
import { CargueraForm } from './carguera-form';
import { cargueras as initialCargueras } from '@/lib/mock-data';

type CargueraFormData = Omit<Carguera, 'id'> & { id?: string };

export function CarguerasClient() {
  const [cargueras, setCargueras] = useState<Carguera[]>(initialCargueras);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCarguera, setEditingCarguera] = useState<Carguera | null>(null);
  const [cargueraToDelete, setCargueraToDelete] = useState<Carguera | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCargueras = useCallback(async () => {
    try {
      const carguerasData = await getCargueras();
      if (carguerasData.length > 0) {
        setCargueras(carguerasData);
      } else {
        setCargueras(initialCargueras);
      }
    } catch (error) {
      console.error("Error fetching cargueras:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar las cargueras desde la base de datos. Mostrando lista por defecto.',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  useEffect(() => {
    fetchCargueras();
  }, [fetchCargueras]);

  const handleOpenDialog = (carguera: Carguera | null = null) => {
    setEditingCarguera(carguera);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingCarguera(null);
  };

  const handleFormSubmit = async (cargueraData: CargueraFormData) => {
    setIsSubmitting(true);
    try {
      if (cargueraData.id) {
        await updateCarguera(cargueraData.id, cargueraData as Carguera);
        toast({ title: 'Éxito', description: 'Carguera actualizada correctamente.' });
      } else {
        await addCarguera(cargueraData as Omit<Carguera, 'id'>);
        toast({ title: 'Éxito', description: 'Carguera añadida correctamente.' });
      }
      await fetchCargueras();
      handleCloseDialog();
    } catch (error) {
       console.error("Error saving carguera:", error);
       const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
       toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar la carguera: ${errorMessage}. Revise la consola y sus reglas de seguridad.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (carguera: Carguera) => {
    setCargueraToDelete(carguera);
  };

  const handleDeleteConfirm = async () => {
    if (!cargueraToDelete) return;
    const idToDelete = cargueraToDelete.id;

    try {
      await deleteCarguera(idToDelete);
      toast({ title: 'Éxito', description: 'Carguera eliminada correctamente.' });
      await fetchCargueras();
    } catch (error) {
      console.error("Error deleting carguera:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar la carguera: ${errorMessage}. Revise la consola y sus reglas de seguridad.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setCargueraToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Cargueras</h2>
            <p className="text-muted-foreground">Administra las cargueras.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Carguera
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
             if (isSubmitting) e.preventDefault();
            }}>
            <DialogHeader>
              <DialogTitle>{editingCarguera ? 'Editar Carguera' : 'Añadir Nueva Carguera'}</DialogTitle>
            </DialogHeader>
            <CargueraForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingCarguera}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Cargueras</CardTitle>
            <CardDescription>Un listado de todas tus cargueras.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre de la Carguera</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargueras.map((carguera) => (
                  <TableRow key={carguera.id}>
                    <TableCell className="font-medium">{carguera.nombreCarguera}</TableCell>
                    <TableCell>{carguera.pais}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(carguera)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(carguera)}>
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

      <AlertDialog open={!!cargueraToDelete} onOpenChange={(open) => !open && setCargueraToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la carguera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCargueraToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
