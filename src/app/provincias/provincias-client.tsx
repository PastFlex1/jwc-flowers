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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getProvincias, addProvincia, updateProvincia, deleteProvincia } from '@/services/provincias';
import type { Provincia } from '@/lib/types';
import { ProvinciaForm } from './provincia-form';

type ProvinciaFormData = Omit<Provincia, 'id'> & { id?: string };

export function ProvinciasClient() {
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvincia, setEditingProvincia] = useState<Provincia | null>(null);
  const [provinciaToDelete, setProvinciaToDelete] = useState<Provincia | null>(null);
  const { toast } = useToast();

  const fetchProvincias = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProvincias();
      setProvincias(data);
    } catch (error) {
      console.error("Error fetching provincias:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar las provincias. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchProvincias();
  }, [fetchProvincias]);


  const handleOpenDialog = (provincia: Provincia | null = null) => {
    setEditingProvincia(provincia);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProvincia(null);
  };

  const handleFormSubmit = async (provinciaData: ProvinciaFormData) => {
    handleCloseDialog();

    if (provinciaData.id) {
      const originalProvincias = [...provincias];
      const updatedProvincia = provinciaData as Provincia;
      setProvincias(prev => prev.map(p => p.id === updatedProvincia.id ? updatedProvincia : p));

      try {
        await updateProvincia(updatedProvincia.id, updatedProvincia);
        toast({ title: 'Éxito', description: 'Provincia actualizada correctamente.' });
      } catch (error) {
        setProvincias(originalProvincias);
        console.error("Error updating provincia:", error);
        toast({
          title: 'Error de Actualización',
          description: 'No se pudo actualizar la provincia.',
          variant: 'destructive',
        });
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      const newProvincia = { ...provinciaData, id: tempId } as Provincia;
      setProvincias(prev => [...prev, newProvincia]);

      try {
        const newId = await addProvincia(provinciaData as Omit<Provincia, 'id'>);
        setProvincias(prev => prev.map(p => p.id === tempId ? { ...newProvincia, id: newId } : p));
        toast({ title: 'Éxito', description: 'Provincia añadida correctamente.' });
      } catch (error) {
        setProvincias(prev => prev.filter(p => p.id !== tempId));
        console.error("Error adding provincia:", error);
        toast({
          title: 'Error al Añadir',
          description: 'No se pudo guardar la provincia.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteClick = (provincia: Provincia) => {
    setProvinciaToDelete(provincia);
  };

  const handleDeleteConfirm = async () => {
    if (!provinciaToDelete) return;

    const originalProvincias = [...provincias];
    const idToDelete = provinciaToDelete.id;

    setProvincias(prev => prev.filter(p => p.id !== idToDelete));
    setProvinciaToDelete(null);

    try {
      await deleteProvincia(idToDelete);
      toast({ title: 'Éxito', description: 'Provincia eliminada correctamente.' });
    } catch (error) {
      setProvincias(originalProvincias);
      console.error("Error deleting provincia:", error);
      toast({
        title: 'Error al Eliminar',
        description: 'No se pudo eliminar la provincia.',
        variant: 'destructive',
      });
    }
  };
  
  const renderSkeleton = () => (
    Array.from({ length: 3 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
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
            <h2 className="text-3xl font-bold tracking-tight font-headline">Provincias</h2>
            <p className="text-muted-foreground">Administra las provincias.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Provincia
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              e.preventDefault();
            }}>
            <DialogHeader>
              <DialogTitle>{editingProvincia ? 'Editar Provincia' : 'Añadir Nueva Provincia'}</DialogTitle>
            </DialogHeader>
            <ProvinciaForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingProvincia}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Provincias</CardTitle>
            <CardDescription>Un listado de todas tus provincias.</CardDescription>
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
                {isLoading ? renderSkeleton() : provincias.map((provincia) => (
                  <TableRow key={provincia.id}>
                    <TableCell className="font-medium">{provincia.nombre}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(provincia)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(provincia)}>
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

      <AlertDialog open={!!provinciaToDelete} onOpenChange={(open) => !open && setProvinciaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la provincia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProvinciaToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
