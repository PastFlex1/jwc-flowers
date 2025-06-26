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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { addCustomer, updateCustomer, deleteCustomer } from '@/services/customers';
import type { Customer } from '@/lib/types';
import { CustomerForm } from './customer-form';
import { useAppData } from '@/context/app-data-context';

type CustomerFormData = Omit<Customer, 'id'> & { id?: string };

export function CustomersClient() {
  const { customers, paises, cargueras, vendedores, refreshData } = useAppData();
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLocalCustomers(customers);
  }, [customers]);

  const handleOpenDialog = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingCustomer(null);
  };

  const handleFormSubmit = async (customerData: CustomerFormData) => {
    setIsSubmitting(true);
    const originalCustomers = [...localCustomers];

    // Optimistic update
    if (customerData.id) {
        setLocalCustomers(prev => prev.map(c => c.id === customerData.id ? { ...c, ...customerData } as Customer : c));
    } else {
        const tempId = `temp-${Date.now()}`;
        setLocalCustomers(prev => [...prev, { ...customerData, id: tempId } as Customer]);
    }
    
    handleCloseDialog();
    
    try {
      if (customerData.id) {
        await updateCustomer(customerData.id, customerData as Customer);
        toast({ title: 'Éxito', description: 'Cliente actualizado correctamente.' });
      } else {
        await addCustomer(customerData as Omit<Customer, 'id'>);
        toast({ title: 'Éxito', description: 'Cliente añadido correctamente.' });
      }
      await refreshData();
    } catch (error) {
      setLocalCustomers(originalCustomers); // Revert on failure
      console.error("Error submitting customer:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
          title: 'Error al Guardar',
          description: `No se pudo guardar el cliente: ${errorMessage}.`,
          variant: 'destructive',
          duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    
    const originalCustomers = [...localCustomers];
    setLocalCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));

    try {
      await deleteCustomer(customerToDelete.id);
      toast({ title: 'Éxito', description: 'Cliente eliminado correctamente.' });
      await refreshData();
    } catch (error) {
      setLocalCustomers(originalCustomers); // Revert on failure
      console.error("Error deleting customer:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar el cliente: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setCustomerToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Clientes</h2>
            <p className="text-muted-foreground">Administra los perfiles de tus clientes.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</DialogTitle>
            </DialogHeader>
            <CustomerForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingCustomer}
              paises={paises}
              cargueras={cargueras}
              vendedores={vendedores}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {localCustomers.map((customer) => (
            <Card key={customer.id} className="flex flex-col">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center flex-grow">
                <h3 className="text-xl font-semibold">{customer.name}</h3>
              </CardContent>
              <div className="p-4 border-t flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(customer)}>
                  Ver
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(customer)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
