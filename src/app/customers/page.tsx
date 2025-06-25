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
import { customers as initialCustomers } from '@/lib/mock-data';
import type { Customer } from '@/lib/types';
import { CustomerForm } from './customer-form';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const handleOpenDialog = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
  };

  const handleFormSubmit = (customerData: Omit<Customer, 'id'> & { id?: string }) => {
    if (customerData.id) {
      setCustomers(customers.map(c => c.id === customerData.id ? (customerData as Customer) : c));
    } else {
      const newCustomer: Customer = {
        id: `cus_${Date.now()}`,
        ...(customerData as Omit<Customer, 'id'>),
      };
      setCustomers(prev => [...prev, newCustomer]);
    }
    handleCloseDialog();
  };
  
  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
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
