
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { addProducto, updateProducto, deleteProducto } from '@/services/productos';
import type { Producto } from '@/lib/types';
import { ProductoForm } from './producto-form';
import { useAppData } from '@/context/app-data-context';
import { useTranslation } from '@/context/i18n-context';

type ProductoFormData = Omit<Producto, 'id'> & { id?: string };

const ITEMS_PER_PAGE = 10;

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

export function ProductosClient() {
  const { productos, refreshData } = useAppData();
  const [localProductos, setLocalProductos] = useState<Producto[]>([]);
  const { t } = useTranslation();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [productoToDelete, setProductoToDelete] = useState<Producto | null>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const filtered = productos.filter(producto =>
      (producto.nombre?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
      (producto.variedad?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase())
    );
    setLocalProductos(filtered);
    setCurrentPage(1);
  }, [productos, debouncedSearchTerm]);


  const totalPages = Math.ceil(localProductos.length / ITEMS_PER_PAGE);

  const paginatedProductos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return localProductos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [localProductos, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleOpenDialog = (producto: Producto | null = null) => {
    setEditingProducto(producto);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingProducto(null);
  };

  const handleFormSubmit = async (productoData: ProductoFormData) => {
    setIsSubmitting(true);
    
    try {
      if (productoData.id) {
        const { id, ...dataToUpdate } = productoData;
        await updateProducto(id, dataToUpdate);
        toast({ title: 'Success', description: 'Product updated successfully.' });
      } else {
        await addProducto(productoData);
        toast({ title: 'Success', description: 'Product added successfully.' });
      }
      await refreshData();
    } catch (error) {
      console.error("Error submitting product:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error Saving',
        description: `Could not save the product: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
      handleCloseDialog();
    }
  };

  const handleDeleteClick = (producto: Producto) => {
    setProductoToDelete(producto);
  };

  const handleDeleteConfirm = async () => {
    if (!productoToDelete) return;
    try {
      await deleteProducto(productoToDelete.id);
      toast({ title: 'Success', description: 'Product deleted successfully.' });
      await refreshData();
    } catch (error) {
      console.error("Error deleting product:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error Deleting',
        description: `Could not delete the product: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
        setProductoToDelete(null);
    }
  };

  const handleInlineUpdate = async (id: string, field: keyof Producto, value: any) => {
    const originalProductos = [...localProductos];
    setLocalProductos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    
    try {
      await updateProducto(id, { [field]: value });
      await refreshData();
      toast({ title: 'Success', description: 'Product updated.' });
    } catch (error) {
      setLocalProductos(originalProductos);
      toast({ title: 'Error', description: 'Failed to update product.', variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">PRODUCTOS</h2>
            <p className="text-muted-foreground">Administra tus productos.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Producto
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProducto ? 'Editar Producto' : 'Añadir Nuevo Producto'}</DialogTitle>
            </DialogHeader>
            <ProductoForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingProducto}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Lista de Productos</CardTitle>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                        />
                    </div>
                </div>
            </div>
            <CardDescription>Una lista de todos tus productos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NOMBRE</TableHead>
                  <TableHead>VARIEDAD</TableHead>
                  <TableHead>COLOR</TableHead>
                  <TableHead>BARRAS</TableHead>
                  <TableHead>PRECIO</TableHead>
                  <TableHead>ESTADO</TableHead>
                  <TableHead className="text-right">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProductos.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell>{producto.variedad}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border"
                          style={{ backgroundColor: producto.color }}
                        />
                        <span>{producto.nombreColor}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Input
                        type="text"
                        defaultValue={producto.barras}
                        onBlur={(e) => handleInlineUpdate(producto.id, 'barras', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="w-28 h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={producto.precio}
                        onBlur={(e) => handleInlineUpdate(producto.id, 'precio', parseFloat(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        className="w-24 h-8"
                      />
                    </TableCell>
                    <TableCell>
                       <Badge 
                        variant={producto.estado === 'Activo' ? 'secondary' : 'destructive'}
                        className="cursor-pointer"
                        onClick={() => handleInlineUpdate(producto.id, 'estado', producto.estado === 'Activo' ? 'Inactivo' : 'Activo')}
                       >
                         {producto.estado}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(producto)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(producto)}>
                           <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
           {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      <AlertDialog open={!!productoToDelete} onOpenChange={(open) => !open && setProductoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductoToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
