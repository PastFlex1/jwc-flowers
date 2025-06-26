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
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/services/customers';
import type { Customer } from '@/lib/types';
import { CustomerForm } from './customer-form';

type CustomerFormData = Omit<Customer, 'id'> & { id?: string };

export function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const customersData = await getCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar los clientes. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenDialog = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
  };

  const handleFormSubmit = async (customerData: CustomerFormData) => {
    try {
      if (customerData.id) {
        await updateCustomer(customerData.id, customerData);
        setCustomers(prev => prev.map(c => c.id === customerData.id ? (customerData as Customer) : c));
        toast({ title: 'Éxito', description: 'Cliente actualizado correctamente.' });
      } else {
        const newId = await addCustomer(customerData as Omit<Customer, 'id'>);
        setCustomers(prev => [...prev, { ...customerData, id: newId } as Customer]);
        toast({ title: 'Éxito', description: 'Cliente añadido correctamente.' });
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el cliente.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const handleDeleteConfirm = async () => {
    if (customerToDelete) {
       try {
        await deleteCustomer(customerToDelete.id);
        setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
        toast({ title: 'Éxito', description: 'Cliente eliminado correctamente.' });
        setCustomerToDelete(null);
      } catch (error) {
        console.error("Error deleting customer:", error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el cliente.',
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
            <h2 className="text-3xl font-bold tracking-tight font-headline">Clientes</h2>
            <p className="text-muted-foreground">Administra los perfiles de tus clientes.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</DialogTitle>
            </DialogHeader>
            <CustomerForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingCustomer}
            />
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {isLoading ? renderSkeleton() : customers.map((customer) => (
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
