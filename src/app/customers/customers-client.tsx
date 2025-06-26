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
import { useToast } from '@/hooks/use-toast';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/services/customers';
import { getPaises } from '@/services/paises';
import { getCargueras } from '@/services/cargueras';
import { getVendedores } from '@/services/vendedores';
import type { Customer, Pais, Carguera, Vendedor } from '@/lib/types';
import { CustomerForm } from './customer-form';
import { cargueras as initialCargueras } from '@/lib/mock-data';

type CustomerFormData = Omit<Customer, 'id'> & { id?: string };

export function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [cargueras, setCargueras] = useState<Carguera[]>(initialCargueras);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [customersData, paisesData, carguerasData, vendedoresData] = await Promise.all([
        getCustomers(),
        getPaises(),
        getCargueras(),
        getVendedores(),
      ]);
      setCustomers(customersData);
      setPaises(paisesData);
      if (carguerasData.length > 0) {
        setCargueras(carguerasData);
      }
      setVendedores(vendedoresData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar los datos necesarios. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    try {
      if (customerData.id) {
        await updateCustomer(customerData.id, customerData as Customer);
        toast({ title: 'Éxito', description: 'Cliente actualizado correctamente.' });
      } else {
        await addCustomer(customerData as Omit<Customer, 'id'>);
        toast({ title: 'Éxito', description: 'Cliente añadido correctamente.' });
      }
      await fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving customer:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar el cliente: ${errorMessage}. Revise la consola y sus reglas de seguridad.`,
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
    const idToDelete = customerToDelete.id;
    
    try {
      await deleteCustomer(idToDelete);
      toast({ title: 'Éxito', description: 'Cliente eliminado correctamente.' });
      await fetchData();
    } catch (error) {
      console.error("Error deleting customer:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar el cliente: ${errorMessage}. Revise la consola y sus reglas de seguridad.`,
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
          <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => {if(isSubmitting) e.preventDefault()}}>
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
