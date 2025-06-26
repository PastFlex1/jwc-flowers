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
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getFincas, addFinca, updateFinca, deleteFinca } from '@/services/fincas';
import type { Finca } from '@/lib/types';
import { FincaForm } from './finca-form';

type FincaFormData = Omit<Finca, 'id'> & { id?: string };

export function FincasClient() {
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFinca, setEditingFinca] = useState<Finca | null>(null);
  const [fincaToDelete, setFincaToDelete] = useState<Finca | null>(null);
  const { toast } = useToast();

  const fetchFincas = useCallback(async () => {
    setIsLoading(true);
    try {
      const fincasData = await getFincas();
      setFincas(fincasData);
    } catch (error) {
      console.error("Error fetching fincas:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar las fincas. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFincas();
  }, [fetchFincas]);

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
    
    if (fincaData.id) {
      const originalFincas = [...fincas];
      const updatedFinca = fincaData as Finca;
      setFincas(prev => prev.map(f => f.id === updatedFinca.id ? updatedFinca : f));

      try {
        await updateFinca(updatedFinca.id, updatedFinca);
        toast({ title: 'Éxito', description: 'Finca actualizada correctamente.' });
      } catch (error) {
        setFincas(originalFincas);
        console.error("Error updating finca:", error);
        toast({
          title: 'Error de Actualización',
          description: 'No se pudo actualizar la finca.',
          variant: 'destructive',
        });
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      const newFinca = { ...fincaData, id: tempId } as Finca;
      setFincas(prev => [...prev, newFinca]);

      try {
        const newId = await addFinca(fincaData);
        setFincas(prev => prev.map(f => f.id === tempId ? { ...newFinca, id: newId } : f));
        toast({ title: 'Éxito', description: 'Finca añadida correctamente.' });
      } catch (error) {
        setFincas(prev => prev.filter(f => f.id !== tempId));
        console.error("Error adding finca:", error);
        toast({
          title: 'Error al Añadir',
          description: 'No se pudo añadir la finca.',
          variant: 'destructive',
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

    setFincas(prev => prev.filter(f => f.id !== idToDelete));
    setFincaToDelete(null);

    try {
      await deleteFinca(idToDelete);
      toast({ title: 'Éxito', description: 'Finca eliminada correctamente.' });
    } catch (error) {
      setFincas(originalFincas);
      console.error("Error deleting finca:", error);
      toast({
        title: 'Error al Eliminar',
        description: 'No se pudo eliminar la finca.',
        variant: 'destructive',
      });
    }
  };

  const renderSkeleton = () => (
    Array.from({ length: 3 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
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
            <h2 className="text-3xl font-bold tracking-tight font-headline">Fincas</h2>
            <p className="text-muted-foreground">Administra las fincas proveedoras.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Finca
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              e.preventDefault();
            }}>
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
                {isLoading ? renderSkeleton() : fincas.map((finca) => (
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
