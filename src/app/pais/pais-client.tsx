
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
import { getPaises, addPais, updatePais, deletePais } from '@/services/paises';
import type { Pais } from '@/lib/types';
import { PaisForm } from './pais-form';

type PaisFormData = Omit<Pais, 'id'> & { id?: string };

export function PaisClient() {
  const [paises, setPaises] = useState<Pais[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPais, setEditingPais] = useState<Pais | null>(null);
  const [paisToDelete, setPaisToDelete] = useState<Pais | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchPaises = useCallback(async () => {
    try {
      const data = await getPaises();
      setPaises(data);
    } catch (error) {
      console.error("Error fetching paises:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar los países. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  useEffect(() => {
    fetchPaises();
  }, [fetchPaises]);


  const handleOpenDialog = (pais: Pais | null = null) => {
    setEditingPais(pais);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingPais(null);
  };

  const handleFormSubmit = async (paisData: PaisFormData) => {
    setIsSubmitting(true);
    try {
      if (paisData.id) {
        await updatePais(paisData.id, paisData as Pais);
        toast({ title: 'Éxito', description: 'País actualizado correctamente.' });
      } else {
        await addPais(paisData as Omit<Pais, 'id'>);
        toast({ title: 'Éxito', description: 'País añadido correctamente.' });
      }
      await fetchPaises();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving pais:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar el país: ${errorMessage}. Revise la consola y sus reglas de seguridad.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (pais: Pais) => {
    setPaisToDelete(pais);
  };

  const handleDeleteConfirm = async () => {
    if (!paisToDelete) return;
    const idToDelete = paisToDelete.id;

    try {
      await deletePais(idToDelete);
      toast({ title: 'Éxito', description: 'País eliminado correctamente.' });
      await fetchPaises();
    } catch (error) {
      console.error("Error deleting pais:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar el país: ${errorMessage}. Revise la consola y sus reglas de seguridad.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
        setPaisToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Países</h2>
            <p className="text-muted-foreground">Administra los países.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir País
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              if (isSubmitting) e.preventDefault();
            }}>
            <DialogHeader>
              <DialogTitle>{editingPais ? 'Editar País' : 'Añadir Nuevo País'}</DialogTitle>
            </DialogHeader>
            <PaisForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingPais}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Países</CardTitle>
            <CardDescription>Un listado de todos tus países.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paises.map((pais) => (
                  <TableRow key={pais.id}>
                    <TableCell className="font-medium">{pais.nombre}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(pais)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(pais)}>
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

      <AlertDialog open={!!paisToDelete} onOpenChange={(open) => !open && setPaisToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el país.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPaisToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
