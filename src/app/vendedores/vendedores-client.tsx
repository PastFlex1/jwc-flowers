'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { addVendedor, updateVendedor, deleteVendedor } from '@/services/vendedores';
import type { Vendedor } from '@/lib/types';
import { VendedorForm } from './vendedor-form';

type VendedorFormData = Omit<Vendedor, 'id'> & { id?: string };

type VendedoresClientProps = {
  initialVendedores: Vendedor[];
};

export function VendedoresClient({ initialVendedores }: VendedoresClientProps) {
  const [vendedores, setVendedores] = useState<Vendedor[]>(initialVendedores);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const [vendedorToDelete, setVendedorToDelete] = useState<Vendedor | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (vendedor: Vendedor | null = null) => {
    setEditingVendedor(vendedor);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVendedor(null);
  };

  const handleFormSubmit = async (vendedorData: VendedorFormData) => {
    handleCloseDialog();
    const originalVendedores = [...vendedores];

    if (vendedorData.id) {
      // Optimistic update
      const updatedVendedores = vendedores.map(v => v.id === vendedorData.id ? { ...v, ...vendedorData } : v);
      setVendedores(updatedVendedores as Vendedor[]);

      try {
        await updateVendedor(vendedorData.id, vendedorData as Vendedor);
        toast({ title: 'Éxito', description: 'Vendedor actualizado correctamente.' });
      } catch (error) {
        setVendedores(originalVendedores);
        console.error("Error updating vendedor:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error al Actualizar',
          description: `No se pudo actualizar el vendedor: ${errorMessage}.`,
          variant: 'destructive',
          duration: 10000,
        });
      }
    } else {
      // Optimistic add
      const tempId = `temp-${Date.now()}`;
      const newVendedor = { ...vendedorData, id: tempId } as Vendedor;
      setVendedores(prev => [...prev, newVendedor]);
      
      try {
        const newId = await addVendedor(vendedorData as Omit<Vendedor, 'id'>);
        setVendedores(prev => prev.map(v => v.id === tempId ? { ...newVendedor, id: newId } : v));
        toast({ title: 'Éxito', description: 'Vendedor añadido correctamente.' });
      } catch (error) {
        setVendedores(originalVendedores);
        console.error("Error adding vendedor:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error al Añadir',
          description: `No se pudo añadir el vendedor: ${errorMessage}.`,
          variant: 'destructive',
          duration: 10000,
        });
      }
    }
  };
  
  const handleDeleteClick = (vendedor: Vendedor) => {
    setVendedorToDelete(vendedor);
  };

  const handleDeleteConfirm = async () => {
    if (!vendedorToDelete) return;

    const originalVendedores = [...vendedores];
    const idToDelete = vendedorToDelete.id;
    
    // Optimistic delete
    setVendedores(prev => prev.filter(v => v.id !== idToDelete));
    setVendedorToDelete(null);

    try {
      await deleteVendedor(idToDelete);
      toast({ title: 'Éxito', description: 'Vendedor eliminado correctamente.' });
    } catch (error) {
      setVendedores(originalVendedores);
      console.error("Error deleting vendedor:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar el vendedor: ${errorMessage}.`,
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
            <h2 className="text-3xl font-bold tracking-tight font-headline">Vendedores</h2>
            <p className="text-muted-foreground">Administra los perfiles de tus vendedores.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Vendedor
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingVendedor ? 'Editar Vendedor' : 'Añadir Nuevo Vendedor'}</DialogTitle>
            </DialogHeader>
            <VendedorForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingVendedor}
            />
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {vendedores.map((vendedor) => (
            <Card key={vendedor.id} className="flex flex-col">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center flex-grow">
                <h3 className="text-xl font-semibold">{vendedor.nombre}</h3>
                <p className="text-muted-foreground">{vendedor.siglas}</p>
              </CardContent>
              <div className="p-4 border-t flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(vendedor)}>
                  Ver
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(vendedor)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={!!vendedorToDelete} onOpenChange={(open) => !open && setVendedorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al vendedor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVendedorToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
