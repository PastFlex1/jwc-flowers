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
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { addProvincia, updateProvincia, deleteProvincia } from '@/services/provincias';
import type { Provincia } from '@/lib/types';
import { ProvinciaForm } from './provincia-form';
import { useAppData } from '@/context/app-data-context';
import { useTranslation } from '@/context/i18n-context';

type ProvinciaFormData = Omit<Provincia, 'id'> & { id?: string };

const ITEMS_PER_PAGE = 10;

export function ProvinciasClient() {
  const { provincias, refreshData } = useAppData();
  const [localProvincias, setLocalProvincias] = useState<Provincia[]>([]);
  const { t } = useTranslation();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvincia, setEditingProvincia] = useState<Provincia | null>(null);
  const [provinciaToDelete, setProvinciaToDelete] = useState<Provincia | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLocalProvincias(provincias);
    setCurrentPage(1);
  }, [provincias]);
  
  const totalPages = Math.ceil(localProvincias.length / ITEMS_PER_PAGE);

  const paginatedProvincias = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return localProvincias.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [localProvincias, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));


  const handleOpenDialog = (provincia: Provincia | null = null) => {
    setEditingProvincia(provincia);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingProvincia(null);
  };

  const handleFormSubmit = async (provinciaData: ProvinciaFormData) => {
    setIsSubmitting(true);
    const originalData = [...localProvincias];

    if (provinciaData.id) {
        setLocalProvincias(prev => prev.map(p => p.id === provinciaData.id ? { ...p, ...provinciaData } as Provincia : p));
    } else {
        const tempId = `temp-${Date.now()}`;
        setLocalProvincias(prev => [...prev, { ...provinciaData, id: tempId } as Provincia]);
    }

    handleCloseDialog();
    
    try {
        if (provinciaData.id) {
            await updateProvincia(provinciaData.id, provinciaData as Provincia);
            toast({ title: 'Éxito', description: 'Provincia actualizada correctamente.' });
        } else {
            await addProvincia(provinciaData as Omit<Provincia, 'id'>);
            toast({ title: 'Éxito', description: 'Provincia añadida correctamente.' });
        }
        await refreshData();
    } catch (error) {
        setLocalProvincias(originalData);
        console.error("Error submitting provincia:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
            title: 'Error al Guardar',
            description: `No se pudo guardar la provincia: ${errorMessage}.`,
            variant: 'destructive',
            duration: 10000,
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (provincia: Provincia) => {
    setProvinciaToDelete(provincia);
  };

  const handleDeleteConfirm = async () => {
    if (!provinciaToDelete) return;
    
    const originalData = [...localProvincias];
    setLocalProvincias(prev => prev.filter(p => p.id !== provinciaToDelete.id));

    try {
      await deleteProvincia(provinciaToDelete.id);
      toast({ title: 'Éxito', description: 'Provincia eliminada correctamente.' });
      await refreshData();
    } catch (error) {
        setLocalProvincias(originalData);
        console.error("Error deleting provincia:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
            title: 'Error al Eliminar',
            description: `No se pudo eliminar la provincia: ${errorMessage}.`,
            variant: 'destructive',
            duration: 10000,
        });
    } finally {
        setProvinciaToDelete(null);
    }
  };
  
  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">{t('provincias.title')}</h2>
            <p className="text-muted-foreground">{t('provincias.description')}</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> {t('provincias.add')}
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProvincia ? 'Editar Provincia' : 'Añadir Nueva Provincia'}</DialogTitle>
            </DialogHeader>
            <ProvinciaForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingProvincia}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Provincias</CardTitle>
            <CardDescription>Un listado de todas tus provincias.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProvincias.map((provincia) => (
                  <TableRow key={provincia.id}>
                    <TableCell className="font-medium">{provincia.nombre}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(provincia)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(provincia)}>
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

      <AlertDialog open={!!provinciaToDelete} onOpenChange={(open) => !open && setProvinciaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la provincia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProvinciaToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
