'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addCustomer, updateCustomer, deleteCustomer } from '@/services/customers';
import type { Customer } from '@/lib/types';
import { CustomerForm } from './customer-form';
import { useAppData } from '@/context/app-data-context';
import { useTranslation } from '@/context/i18n-context';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

type CustomerFormData = Omit<Customer, 'id'> & { id?: string };

const ITEMS_PER_PAGE = 10;

export function CustomersClient() {
  const { customers, paises, cargueras, vendedores, daes, refreshData } = useAppData();
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const filtered = customers.filter(customer => {
        const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
        const searchFields = [
            customer.name,
            customer.cedula,
        ];
        return searchFields.some(field => field?.toLowerCase().includes(lowerCaseSearch));
    });
    setLocalCustomers(filtered);
    setCurrentPage(1);
  }, [customers, debouncedSearchTerm]);

  const totalPages = Math.ceil(localCustomers.length / ITEMS_PER_PAGE);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return localCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [localCustomers, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

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
            <h2 className="text-3xl font-bold tracking-tight font-headline">{t('customers.title')}</h2>
            <p className="text-muted-foreground">{t('customers.description')}</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> {t('customers.newCustomer')}
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
              daes={daes}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
        
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {paginatedCustomers.map((customer) => (
            <Card key={customer.id} className="flex flex-col">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center flex-grow">
                <h3 className="text-xl font-semibold">{customer.name}</h3>
                <p className="text-sm text-muted-foreground">{customer.cedula}</p>
              </CardContent>
              <div className="p-4 border-t flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(customer)}>
                  {t('customers.edit')}
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(customer)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t('customers.delete')}</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
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
