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
    setIsDialogOpen(false);
    setEditingPais(null);
  };

  const handleFormSubmit = async (paisData: PaisFormData) => {
    handleCloseDialog();
    const originalPaises = [...paises];

    if (paisData.id) {
      // Optimistic update
      const updatedPaises = paises.map(p => p.id === paisData.id ? { ...p, ...paisData } : p);
      setPaises(updatedPaises as Pais[]);
      try {
        await updatePais(paisData.id, paisData as Pais);
        toast({ title: 'Éxito', description: 'País actualizado correctamente.' });
      } catch (error) {
        setPaises(originalPaises);
        console.error("Error updating pais:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error al Actualizar',
          description: `No se pudo actualizar el país: ${errorMessage}.`,
          variant: 'destructive',
          duration: 10000,
        });
      }
    } else {
      // Optimistic add
      const tempId = `temp-${Date.now()}`;
      const newPais = { ...paisData, id: tempId } as Pais;
      setPaises(prev => [...prev, newPais]);

      try {
        const newId = await addPais(paisData as Omit<Pais, 'id'>);
        setPaises(prev => prev.map(p => p.id === tempId ? { ...newPais, id: newId } : p));
        toast({ title: 'Éxito', description: 'País añadido correctamente.' });
      } catch (error) {
        setPaises(originalPaises);
        console.error("Error adding pais:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error al Añadir',
          description: `No se pudo añadir el país: ${errorMessage}.`,
          variant: 'destructive',
          duration: 10000,
        });
      }
    }
  };

  const handleDeleteClick = (pais: Pais) => {
    setPaisToDelete(pais);
  };

  const handleDeleteConfirm = async () => {
    if (!paisToDelete) return;
    
    const originalPaises = [...paises];
    const idToDelete = paisToDelete.id;

    // Optimistic delete
    setPaises(prev => prev.filter(p => p.id !== idToDelete));
    setPaisToDelete(null);

    try {
      await deletePais(idToDelete);
      toast({ title: 'Éxito', description: 'País eliminado correctamente.' });
    } catch (error) {
      setPaises(originalPaises);
      console.error("Error deleting pais:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar el país: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPais ? 'Editar País' : 'Añadir Nuevo País'}</DialogTitle>
            </DialogHeader>
            <PaisForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingPais}
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
