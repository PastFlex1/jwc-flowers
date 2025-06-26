'use client';

import { useState } from 'react';
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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { addFinca, updateFinca, deleteFinca } from '@/services/fincas';
import type { Finca } from '@/lib/types';
import { FincaForm } from './finca-form';

type FincaFormData = Omit<Finca, 'id'> & { id?: string };

type FincasClientProps = {
  initialFincas: Finca[];
};

export function FincasClient({ initialFincas }: FincasClientProps) {
  const [fincas, setFincas] = useState<Finca[]>(initialFincas);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFinca, setEditingFinca] = useState<Finca | null>(null);
  const [fincaToDelete, setFincaToDelete] = useState<Finca | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (finca: Finca | null = null) => {
    setEditingFinca(finca);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFinca(null);
  };

  const handleFormSubmit = async (fincaData: FincaFormData) => {
    handleCloseDialog();
    const originalFincas = [...fincas];

    if (fincaData.id) {
      // Optimistic update
      const updatedFincas = fincas.map(f => f.id === fincaData.id ? { ...f, ...fincaData } : f);
      setFincas(updatedFincas as Finca[]);

      try {
        await updateFinca(fincaData.id, fincaData as Finca);
        toast({ title: 'Éxito', description: 'Finca actualizada correctamente.' });
      } catch (error) {
        setFincas(originalFincas);
        console.error("Error updating finca:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error al Actualizar',
          description: `No se pudo actualizar la finca: ${errorMessage}.`,
          variant: 'destructive',
          duration: 10000,
        });
      }
    } else {
      // Optimistic add
      const tempId = `temp-${Date.now()}`;
      const newFinca = { ...fincaData, id: tempId } as Finca;
      setFincas(prev => [...prev, newFinca]);

      try {
        const newId = await addFinca(fincaData);
        setFincas(prev => prev.map(f => f.id === tempId ? { ...newFinca, id: newId } : f));
        toast({ title: 'Éxito', description: 'Finca añadida correctamente.' });
      } catch (error) {
        setFincas(originalFincas);
        console.error("Error adding finca:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error al Añadir',
          description: `No se pudo añadir la finca: ${errorMessage}.`,
          variant: 'destructive',
          duration: 10000,
        });
      }
    }
  };

  const handleDeleteClick = (finca: Finca) => {
    setFincaToDelete(finca);
  };

  const handleDeleteConfirm = async () => {
    if (!fincaToDelete) return;
    
    const originalFincas = [...fincas];
    const idToDelete = fincaToDelete.id;
    
    // Optimistic delete
    setFincas(prev => prev.filter(f => f.id !== idToDelete));
    setFincaToDelete(null);

    try {
      await deleteFinca(idToDelete);
      toast({ title: 'Éxito', description: 'Finca eliminada correctamente.' });
    } catch (error) {
      setFincas(originalFincas);
      console.error("Error deleting finca:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar la finca: ${errorMessage}.`,
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
            <h2 className="text-3xl font-bold tracking-tight font-headline">Fincas</h2>
            <p className="text-muted-foreground">Administra las fincas proveedoras.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Finca
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingFinca ? 'Editar Finca' : 'Añadir Nueva Finca'}</DialogTitle>
            </DialogHeader>
            <FincaForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingFinca}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Fincas</CardTitle>
            <CardDescription>Un listado de todas tus fincas guardadas en la base de datos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Tax ID / RUC</TableHead>
                  <TableHead>Tipo de Producto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fincas.map((finca) => (
                  <TableRow key={finca.id}>
                    <TableCell className="font-medium">{finca.name}</TableCell>
                    <TableCell>{finca.address}</TableCell>
                    <TableCell>{finca.phone}</TableCell>
                    <TableCell>{finca.taxId}</TableCell>
                    <TableCell>{finca.productType}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(finca)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(finca)}>
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

      <AlertDialog open={!!fincaToDelete} onOpenChange={(open) => !open && setFincaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la finca de tus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFincaToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
