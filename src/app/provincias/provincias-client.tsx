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
import { addProvincia, updateProvincia, deleteProvincia } from '@/services/provincias';
import type { Provincia } from '@/lib/types';
import { ProvinciaForm } from './provincia-form';
import { useAppData } from '@/context/app-data-context';

type ProvinciaFormData = Omit<Provincia, 'id'> & { id?: string };

export function ProvinciasClient() {
  const { provincias, refreshData } = useAppData();
  const [localProvincias, setLocalProvincias] = useState<Provincia[]>([]);
  
  useEffect(() => {
    setLocalProvincias(provincias);
  }, [provincias]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvincia, setEditingProvincia] = useState<Provincia | null>(null);
  const [provinciaToDelete, setProvinciaToDelete] = useState<Provincia | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (provincia: Provincia | null = null) => {
    setEditingProvincia(provincia);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingProvincia(null);
  };

  const handleFormSubmit = async (provinciaData: ProvinciaFormData) => {
    setIsSubmitting(true);
    const originalData = [...localProvincias];

    if (provinciaData.id) {
        setLocalProvincias(prev => prev.map(p => p.id === provinciaData.id ? { ...p, ...provinciaData } as Provincia : p));
    } else {
        const tempId = `temp-${Date.now()}`;
        setLocalProvincias(prev => [...prev, { ...provinciaData, id: tempId } as Provincia]);
    }

    handleCloseDialog();
    
    try {
        if (provinciaData.id) {
            await updateProvincia(provinciaData.id, provinciaData as Provincia);
            toast({ title: 'Éxito', description: 'Provincia actualizada correctamente.' });
        } else {
            await addProvincia(provinciaData as Omit<Provincia, 'id'>);
            toast({ title: 'Éxito', description: 'Provincia añadida correctamente.' });
        }
        await refreshData();
    } catch (error) {
        setLocalProvincias(originalData);
        console.error("Error submitting provincia:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
            title: 'Error al Guardar',
            description: `No se pudo guardar la provincia: ${errorMessage}.`,
            variant: 'destructive',
            duration: 10000,
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (provincia: Provincia) => {
    setProvinciaToDelete(provincia);
  };

  const handleDeleteConfirm = async () => {
    if (!provinciaToDelete) return;
    
    const originalData = [...localProvincias];
    setLocalProvincias(prev => prev.filter(p => p.id !== provinciaToDelete.id));

    try {
      await deleteProvincia(provinciaToDelete.id);
      toast({ title: 'Éxito', description: 'Provincia eliminada correctamente.' });
      await refreshData();
    } catch (error) {
        setLocalProvincias(originalData);
        console.error("Error deleting provincia:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
            title: 'Error al Eliminar',
            description: `No se pudo eliminar la provincia: ${errorMessage}.`,
            variant: 'destructive',
            duration: 10000,
        });
    } finally {
        setProvinciaToDelete(null);
    }
  };
  
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

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProvincia ? 'Editar Provincia' : 'Añadir Nueva Provincia'}</DialogTitle>
            </DialogHeader>
            <ProvinciaForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingProvincia}
              isSubmitting={isSubmitting}
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
                {localProvincias.map((provincia) => (
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
