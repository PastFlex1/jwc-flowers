'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { addPais, updatePais, deletePais } from '@/services/paises';
import type { Pais } from '@/lib/types';
import { PaisForm } from './pais-form';
import { useAppData } from '@/context/app-data-context';
import { useTranslation } from '@/context/i18n-context';


type PaisFormData = Omit<Pais, 'id'> & { id?: string };

export function PaisClient() {
  const { paises, refreshData } = useAppData();
  const [localPaises, setLocalPaises] = useState<Pais[]>([]);
  const { t } = useTranslation();
  
  useEffect(() => {
    setLocalPaises(paises);
  }, [paises]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPais, setEditingPais] = useState<Pais | null>(null);
  const [paisToDelete, setPaisToDelete] = useState<Pais | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (pais: Pais | null = null) => {
    setEditingPais(pais);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if(isSubmitting) return;
    setIsDialogOpen(false);
    setEditingPais(null);
  };

  const handleFormSubmit = async (paisData: PaisFormData) => {
    setIsSubmitting(true);
    const originalData = [...localPaises];

    if (paisData.id) {
        setLocalPaises(prev => prev.map(p => p.id === paisData.id ? { ...p, ...paisData } as Pais : p));
    } else {
        const tempId = `temp-${Date.now()}`;
        setLocalPaises(prev => [...prev, { ...paisData, id: tempId } as Pais]);
    }

    handleCloseDialog();
    
    try {
      if (paisData.id) {
        await updatePais(paisData.id, paisData as Pais);
        toast({ title: 'Éxito', description: 'País actualizado correctamente.' });
      } else {
        await addPais(paisData as Omit<Pais, 'id'>);
        toast({ title: 'Éxito', description: 'País añadido correctamente.' });
      }
      await refreshData();
    } catch (error) {
      setLocalPaises(originalData);
      console.error("Error submitting pais:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar el país: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (pais: Pais) => {
    setPaisToDelete(pais);
  };

  const handleDeleteConfirm = async () => {
    if (!paisToDelete) return;
    
    const originalData = [...localPaises];
    setLocalPaises(prev => prev.filter(p => p.id !== paisToDelete.id));

    try {
      await deletePais(paisToDelete.id);
      toast({ title: 'Éxito', description: 'País eliminado correctamente.' });
      await refreshData();
    } catch (error) {
      setLocalPaises(originalData);
      console.error("Error deleting pais:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Eliminar',
        description: `No se pudo eliminar el país: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
        setPaisToDelete(null);
    }
  };
  
  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">{t('pais.title')}</h2>
            <p className="text-muted-foreground">{t('pais.description')}</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> {t('pais.add')}
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPais ? 'Editar País' : 'Añadir Nuevo País'}</DialogTitle>
            </DialogHeader>
            <PaisForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingPais}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Países</CardTitle>
            <CardDescription>Un listado de todos tus países.</CardDescription>
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
                {localPaises.map((pais) => (
                  <TableRow key={pais.id}>
                    <TableCell className="font-medium">{pais.nombre}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(pais)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(pais)}>
                           <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!paisToDelete} onOpenChange={(open) => !open && setPaisToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el país.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPaisToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
