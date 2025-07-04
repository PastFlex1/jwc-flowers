'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { addConsignatario, updateConsignatario, deleteConsignatario } from '@/services/consignatarios';
import type { Consignatario } from '@/lib/types';
import { ConsignatarioForm } from './consignatario-form';
import { useAppData } from '@/context/app-data-context';
import { useTranslation } from '@/context/i18n-context';

type ConsignatarioFormData = Omit<Consignatario, 'id'> & { id?: string };

export function ConsignatariosClient() {
  const { consignatarios, paises, customers, provincias, refreshData } = useAppData();
  const [localConsignatarios, setLocalConsignatarios] = useState<Consignatario[]>([]);
  const { t } = useTranslation();
  
  useEffect(() => {
    setLocalConsignatarios(consignatarios);
  }, [consignatarios]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConsignatario, setEditingConsignatario] = useState<Consignatario | null>(null);
  const [consignatarioToDelete, setConsignatarioToDelete] = useState<Consignatario | null>(null);
  const { toast } = useToast();

  const customerMap = useMemo(() => {
    return customers.reduce((acc, customer) => {
      acc[customer.id] = customer.name;
      return acc;
    }, {} as Record<string, string>);
  }, [customers]);

  const handleOpenDialog = (consignatario: Consignatario | null = null) => {
    setEditingConsignatario(consignatario);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setEditingConsignatario(null);
  };

  const handleFormSubmit = async (formData: ConsignatarioFormData) => {
    setIsSubmitting(true);
    const originalData = [...localConsignatarios];
    
    // Optimistic Update
    if (formData.id) {
        setLocalConsignatarios(prev => prev.map(c => c.id === formData.id ? { ...c, ...formData } as Consignatario : c));
    } else {
        const tempId = `temp-${Date.now()}`;
        setLocalConsignatarios(prev => [...prev, { ...formData, id: tempId } as Consignatario]);
    }
    
    handleCloseDialog();
    
    try {
      if (formData.id) {
        await updateConsignatario(formData.id, formData as Consignatario);
        toast({ title: 'Éxito', description: 'Consignatario actualizado correctamente.' });
      } else {
        await addConsignatario(formData as Omit<Consignatario, 'id'>);
        toast({ title: 'Éxito', description: 'Consignatario añadido correctamente.' });
      }
      await refreshData();
    } catch (error) {
      setLocalConsignatarios(originalData); // Revert
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar el consignatario: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (consignatario: Consignatario) => {
    setConsignatarioToDelete(consignatario);
  };

  const handleDeleteConfirm = async () => {
    if (!consignatarioToDelete) return;

    const originalData = [...localConsignatarios];
    setLocalConsignatarios(prev => prev.filter(c => c.id !== consignatarioToDelete.id));

    try {
      await deleteConsignatario(consignatarioToDelete.id);
      toast({ title: 'Éxito', description: 'Consignatario eliminado correctamente.' });
      await refreshData();
    } catch (error) {
        setLocalConsignatarios(originalData);
        console.error("Error deleting consignatario:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error al Eliminar',
          description: `No se pudo eliminar el consignatario: ${errorMessage}.`,
          variant: 'destructive',
          duration: 10000,
        });
    } finally {
      setConsignatarioToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">{t('consignatarios.title')}</h2>
            <p className="text-muted-foreground">{t('consignatarios.description')}</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> {t('consignatarios.add')}
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingConsignatario ? 'Editar Consignatario' : 'Añadir Nuevo Consignatario'}</DialogTitle>
            </DialogHeader>
            <ConsignatarioForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingConsignatario}
              paises={paises}
              customers={customers}
              provincias={provincias}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Consignatarios</CardTitle>
            <CardDescription>Un listado de todos tus consignatarios.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Provincia</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localConsignatarios.map((consignatario) => (
                    <TableRow key={consignatario.id}>
                      <TableCell className="font-medium">{consignatario.nombreConsignatario}</TableCell>
                      <TableCell>{customerMap[consignatario.customerId] || 'N/A'}</TableCell>
                      <TableCell>{consignatario.pais}</TableCell>
                      <TableCell>{consignatario.provincia}</TableCell>
                      <TableCell>{consignatario.direccion}</TableCell>
                      <TableCell className="text-right space-x-0">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(consignatario)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(consignatario)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!consignatarioToDelete} onOpenChange={(open) => !open && setConsignatarioToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el consignatario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConsignatarioToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
