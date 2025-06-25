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
import { vendedores as initialVendedores } from '@/lib/mock-data';
import type { Vendedor } from '@/lib/types';
import { VendedorForm } from './vendedor-form';

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>(initialVendedores);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const [vendedorToDelete, setVendedorToDelete] = useState<Vendedor | null>(null);

  const handleOpenDialog = (vendedor: Vendedor | null = null) => {
    setEditingVendedor(vendedor);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVendedor(null);
  };

  const handleFormSubmit = (vendedorData: Omit<Vendedor, 'id'> & { id?: string }) => {
    if (vendedorData.id) {
      setVendedores(vendedores.map(v => v.id === vendedorData.id ? (vendedorData as Vendedor) : v));
    } else {
      const newVendedor: Vendedor = {
        id: `ven_${Date.now()}`,
        ...(vendedorData as Omit<Vendedor, 'id'>),
      };
      setVendedores(prev => [...prev, newVendedor]);
    }
    handleCloseDialog();
  };
  
  const handleDeleteClick = (vendedor: Vendedor) => {
    setVendedorToDelete(vendedor);
  };

  const handleDeleteConfirm = () => {
    if (vendedorToDelete) {
      setVendedores(vendedores.filter(v => v.id !== vendedorToDelete.id));
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
