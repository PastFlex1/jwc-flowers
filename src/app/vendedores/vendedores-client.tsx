'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getVendedores, addVendedor, updateVendedor, deleteVendedor } from '@/services/vendedores';
import type { Vendedor } from '@/lib/types';
import { VendedorForm } from './vendedor-form';

type VendedorFormData = Omit<Vendedor, 'id'> & { id?: string };

export function VendedoresClient() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const [vendedorToDelete, setVendedorToDelete] = useState<Vendedor | null>(null);
  const { toast } = useToast();

  const fetchVendedores = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getVendedores();
      setVendedores(data);
    } catch (error) {
      console.error("Error fetching vendedores:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar los vendedores. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVendedores();
  }, [fetchVendedores]);

  const handleOpenDialog = (vendedor: Vendedor | null = null) => {
    setEditingVendedor(vendedor);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVendedor(null);
  };

  const handleFormSubmit = async (vendedorData: VendedorFormData) => {
    try {
      if (vendedorData.id) {
        await updateVendedor(vendedorData.id, vendedorData);
        setVendedores(prev => prev.map(v => v.id === vendedorData.id ? (vendedorData as Vendedor) : v));
        toast({ title: 'Éxito', description: 'Vendedor actualizado correctamente.' });
      } else {
        const newId = await addVendedor(vendedorData as Omit<Vendedor, 'id'>);
        setVendedores(prev => [...prev, { ...vendedorData, id: newId } as Vendedor]);
        toast({ title: 'Éxito', description: 'Vendedor añadido correctamente.' });
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el vendedor.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteClick = (vendedor: Vendedor) => {
    setVendedorToDelete(vendedor);
  };

  const handleDeleteConfirm = async () => {
    if (vendedorToDelete) {
      try {
        await deleteVendedor(vendedorToDelete.id);
        setVendedores(prev => prev.filter(v => v.id !== vendedorToDelete.id));
        toast({ title: 'Éxito', description: 'Vendedor eliminado correctamente.' });
        setVendedorToDelete(null);
      } catch (error) {
        console.error("Error deleting vendedor:", error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el vendedor.',
          variant: 'destructive',
        });
      }
    }
  };
  
  const renderSkeleton = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <Card key={`skeleton-${index}`}>
         <CardContent className="p-6 flex flex-col items-center justify-center text-center flex-grow">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-8" />
          </CardContent>
          <div className="p-4 border-t flex justify-center gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-9" />
          </div>
      </Card>
    ))
  );

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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
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
          {isLoading ? renderSkeleton() : vendedores.map((vendedor) => (
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
