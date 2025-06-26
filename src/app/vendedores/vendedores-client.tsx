'use client';

import { useState, useEffect } from 'react';
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
import { useAppData } from '@/context/app-data-context';


type VendedorFormData = Omit<Vendedor, 'id'> & { id?: string };

export function VendedoresClient() {
  const { vendedores, refreshData } = useAppData();
  const [localVendedores, setLocalVendedores] = useState<Vendedor[]>([]);

  useEffect(() => {
    setLocalVendedores(vendedores);
  }, [vendedores]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const [vendedorToDelete, setVendedorToDelete] = useState<Vendedor | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (vendedor: Vendedor | null = null) => {
    setEditingVendedor(vendedor);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingVendedor(null);
  };

  const handleFormSubmit = async (vendedorData: VendedorFormData) => {
    setIsSubmitting(true);
    const originalData = [...localVendedores];

    if (vendedorData.id) {
        setLocalVendedores(prev => prev.map(v => v.id === vendedorData.id ? { ...v, ...vendedorData } as Vendedor : v));
    } else {
        const tempId = `temp-${Date.now()}`;
        setLocalVendedores(prev => [...prev, { ...vendedorData, id: tempId } as Vendedor]);
    }

    handleCloseDialog();
    
    try {
      if (vendedorData.id) {
        await updateVendedor(vendedorData.id, vendedorData as Vendedor);
        toast({ title: 'Éxito', description: 'Vendedor actualizado correctamente.' });
      } else {
        await addVendedor(vendedorData as Omit<Vendedor, 'id'>);
        toast({ title: 'Éxito', description: 'Vendedor añadido correctamente.' });
      }
      await refreshData();
    } catch (error) {
      setLocalVendedores(originalData);
      console.error("Error submitting vendedor:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar el vendedor: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteClick = (vendedor: Vendedor) => {
    setVendedorToDelete(vendedor);
  };

  const handleDeleteConfirm = async () => {
    if (!vendedorToDelete) return;
    
    const originalData = [...localVendedores];
    setLocalVendedores(prev => prev.filter(v => v.id !== vendedorToDelete.id));

    try {
      await deleteVendedor(vendedorToDelete.id);
      toast({ title: 'Éxito', description: 'Vendedor eliminado correctamente.' });
      await refreshData();
    } catch (error) {
      setLocalVendedores(originalData);
      console.error("Error deleting vendedor:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar el vendedor: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setVendedorToDelete(null);
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
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {localVendedores.map((vendedor) => (
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
