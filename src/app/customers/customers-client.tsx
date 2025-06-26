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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { addCustomer, updateCustomer, deleteCustomer } from '@/services/customers';
import type { Customer, Pais, Carguera, Vendedor } from '@/lib/types';
import { CustomerForm } from './customer-form';

type CustomerFormData = Omit<Customer, 'id'> & { id?: string };

type CustomersClientProps = {
  initialCustomers: Customer[];
  paises: Pais[];
  cargueras: Carguera[];
  vendedores: Vendedor[];
};

export function CustomersClient({ initialCustomers, paises, cargueras, vendedores }: CustomersClientProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
  };

  const handleFormSubmit = async (customerData: CustomerFormData) => {
    handleCloseDialog();
    const originalCustomers = [...customers];

    if (customerData.id) {
      // Optimistic update
      const updatedCustomers = customers.map(c => 
        c.id === customerData.id ? { ...c, ...(customerData as Customer) } : c
      );
      setCustomers(updatedCustomers);

      try {
        await updateCustomer(customerData.id, customerData as Customer);
        toast({ title: 'Éxito', description: 'Cliente actualizado correctamente.' });
      } catch (error) {
        setCustomers(originalCustomers);
        console.error("Error updating customer:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
            title: 'Error al Actualizar',
            description: `No se pudo actualizar el cliente: ${errorMessage}.`,
            variant: 'destructive',
            duration: 10000,
        });
      }
    } else {
      // Optimistic add
      const tempId = `temp-${Date.now()}`;
      const newCustomer = { ...customerData, id: tempId } as Customer;
      setCustomers(prev => [...prev, newCustomer]);

      try {
        const newId = await addCustomer(customerData as Omit<Customer, 'id'>);
        setCustomers(prev => prev.map(c => c.id === tempId ? { ...newCustomer, id: newId } : c));
        toast({ title: 'Éxito', description: 'Cliente añadido correctamente.' });
      } catch (error) {
        setCustomers(originalCustomers);
        console.error("Error adding customer:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
            title: 'Error al Añadir',
            description: `No se pudo añadir el cliente: ${errorMessage}.`,
            variant: 'destructive',
            duration: 10000,
        });
      }
    }
  };
  
  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    const originalCustomers = [...customers];
    const idToDelete = customerToDelete.id;
    
    // Optimistic delete
    setCustomers(prev => prev.filter(c => c.id !== idToDelete));
    setCustomerToDelete(null);

    try {
      await deleteCustomer(idToDelete);
      toast({ title: 'Éxito', description: 'Cliente eliminado correctamente.' });
    } catch (error) {
      setCustomers(originalCustomers);
      console.error("Error deleting customer:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar el cliente: ${errorMessage}.`,
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
            />
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {customers.map((customer) => (
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
