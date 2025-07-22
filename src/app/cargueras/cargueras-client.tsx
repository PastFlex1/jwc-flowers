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
import { addCarguera, updateCarguera, deleteCarguera } from '@/services/cargueras';
import type { Carguera } from '@/lib/types';
import { CargueraForm } from './carguera-form';
import { useAppData } from '@/context/app-data-context';
import { useTranslation } from '@/context/i18n-context';

type CargueraFormData = Omit<Carguera, 'id'> & { id?: string };

const ITEMS_PER_PAGE = 10;

export function CarguerasClient() {
  const { cargueras, refreshData } = useAppData();
  const [localCargueras, setLocalCargueras] = useState<Carguera[]>([]);
  const { t } = useTranslation();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCarguera, setEditingCarguera] = useState<Carguera | null>(null);
  const [cargueraToDelete, setCargueraToDelete] = useState<Carguera | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLocalCargueras(cargueras);
    setCurrentPage(1);
  }, [cargueras]);
  
  const totalPages = Math.ceil(localCargueras.length / ITEMS_PER_PAGE);

  const paginatedCargueras = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return localCargueras.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [localCargueras, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleOpenDialog = (carguera: Carguera | null = null) => {
    setEditingCarguera(carguera);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingCarguera(null);
  };

  const handleFormSubmit = async (cargueraData: CargueraFormData) => {
    setIsSubmitting(true);
    const originalCargueras = [...localCargueras];
    
    // Optimistic Update
    if (cargueraData.id) {
        setLocalCargueras(prev => prev.map(c => c.id === cargueraData.id ? { ...c, ...cargueraData } as Carguera : c));
    } else {
        const tempId = `temp-${Date.now()}`;
        setLocalCargueras(prev => [...prev, { ...cargueraData, id: tempId } as Carguera]);
    }
    
    handleCloseDialog();

    try {
        if (cargueraData.id) {
            await updateCarguera(cargueraData.id, cargueraData as Carguera);
            toast({ title: 'Success', description: 'Carrier updated successfully.' });
        } else {
            await addCarguera(cargueraData as Omit<Carguera, 'id'>);
            toast({ title: 'Success', description: 'Carrier added successfully.' });
        }
        await refreshData();
    } catch (error) {
        setLocalCargueras(originalCargueras);
        console.error("Error submitting form:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
            title: 'Error Saving',
            description: `Could not save the carrier: ${errorMessage}.`,
            variant: 'destructive',
            duration: 10000,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (carguera: Carguera) => {
    setCargueraToDelete(carguera);
  };

  const handleDeleteConfirm = async () => {
    if (!cargueraToDelete) return;
    
    const originalCargueras = [...localCargueras];
    setLocalCargueras(prev => prev.filter(c => c.id !== cargueraToDelete.id));
    
    try {
      await deleteCarguera(cargueraToDelete.id);
      toast({ title: 'Success', description: 'Carrier deleted successfully.' });
      await refreshData();
    } catch (error) {
      setLocalCargueras(originalCargueras);
      console.error("Error deleting carguera:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error Deleting',
        description: `Could not delete the carrier: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setCargueraToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">{t('cargueras.title')}</h2>
            <p className="text-muted-foreground">{t('cargueras.description')}</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> {t('cargueras.add')}
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCarguera ? 'Edit Carrier' : 'Add New Carrier'}</DialogTitle>
            </DialogHeader>
            <CargueraForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingCarguera}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Carrier List</CardTitle>
            <CardDescription>A list of all your carriers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCargueras.map((carguera) => (
                  <TableRow key={carguera.id}>
                    <TableCell className="font-medium">{carguera.nombreCarguera}</TableCell>
                    <TableCell>{carguera.pais}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(carguera)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(carguera)}>
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

      <AlertDialog open={!!cargueraToDelete} onOpenChange={(open) => !open && setCargueraToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the carrier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCargueraToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
