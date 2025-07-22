
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { addProducto, updateProducto, deleteProducto } from '@/services/productos';
import type { Producto } from '@/lib/types';
import { ProductoForm } from './producto-form';
import { useAppData } from '@/context/app-data-context';
import { useTranslation } from '@/context/i18n-context';

type ProductoFormData = Omit<Producto, 'id'> & { id?: string };

const ITEMS_PER_PAGE = 10;

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

  useEffect(() => {
    setLocalProductos(productos);
    setCurrentPage(1);
  }, [productos]);

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
    const originalProductos = [...localProductos];

    // Optimistic Update
    if (productoData.id) {
        setLocalProductos(prev => prev.map(p => p.id === productoData.id ? { ...p, ...productoData } as Producto : p));
    } else {
        const tempId = `temp-${Date.now()}`;
        setLocalProductos(prev => [...prev, { ...productoData, id: tempId } as Producto]);
    }

    handleCloseDialog();

    try {
      if (productoData.id) {
        await updateProducto(productoData.id, productoData as Producto);
        toast({ title: 'Éxito', description: 'Producto actualizado correctamente.' });
      } else {
        await addProducto(productoData);
        toast({ title: 'Éxito', description: 'Producto añadido correctamente.' });
      }
      await refreshData();
    } catch (error) {
      setLocalProductos(originalProductos); // Revert on failure
      console.error("Error submitting producto:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar el producto: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (producto: Producto) => {
    setProductoToDelete(producto);
  };

  const handleDeleteConfirm = async () => {
    if (!productoToDelete) return;

    const originalProductos = [...localProductos];
    setLocalProductos(prev => prev.filter(p => p.id !== productoToDelete.id));
    
    try {
      await deleteProducto(productoToDelete.id);
      toast({ title: 'Éxito', description: 'Producto eliminado correctamente.' });
      await refreshData();
    } catch (error) {
      setLocalProductos(originalProductos); // Revert
      console.error("Error deleting producto:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar el producto: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
        setProductoToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">{t('productos.title')}</h2>
            <p className="text-muted-foreground">{t('productos.description')}</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> {t('productos.add')}
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
            <CardTitle>Lista de Productos</CardTitle>
            <CardDescription>Un listado de todos tus productos guardados.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Variedad</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProductos.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell>{producto.tipo}</TableCell>
                    <TableCell>{producto.variedad}</TableCell>
                    <TableCell>{producto.stock}</TableCell>
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
            </CardFooter>
          )}
        </Card>
      </div>

      <AlertDialog open={!!productoToDelete} onOpenChange={(open) => !open && setProductoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto de tus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductoToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
