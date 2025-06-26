'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { getConsignatarios, addConsignatario, updateConsignatario, deleteConsignatario } from '@/services/consignatarios';
import { getPaises } from '@/services/paises';
import type { Consignatario, Pais } from '@/lib/types';
import { ConsignatarioForm } from './consignatario-form';

type ConsignatarioFormData = Omit<Consignatario, 'id'> & { id?: string };

export function ConsignatariosClient() {
  const [consignatarios, setConsignatarios] = useState<Consignatario[]>([]);
  const [paises, setPaises] = useState<Pais[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConsignatario, setEditingConsignatario] = useState<Consignatario | null>(null);
  const [consignatarioToDelete, setConsignatarioToDelete] = useState<Consignatario | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [consignatariosData, paisesData] = await Promise.all([
          getConsignatarios(),
          getPaises(),
      ]);
      setConsignatarios(consignatariosData);
      setPaises(paisesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar los datos. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (consignatario: Consignatario | null = null) => {
    setEditingConsignatario(consignatario);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingConsignatario(null);
  };

  const handleFormSubmit = async (formData: ConsignatarioFormData) => {
    handleCloseDialog();
    
    if (formData.id) {
      const originalData = [...consignatarios];
      const updatedData = formData as Consignatario;
      setConsignatarios(prev => prev.map(c => c.id === updatedData.id ? updatedData : c));

      try {
        await updateConsignatario(updatedData.id, updatedData);
        toast({ title: 'Éxito', description: 'Consignatario actualizado correctamente.' });
      } catch (error) {
        setConsignatarios(originalData);
        console.error("Error updating consignatario:", error);
        toast({
          title: 'Error de Actualización',
          description: 'No se pudo actualizar el consignatario. Revise la consola para más detalles.',
          variant: 'destructive',
        });
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      const newData = { ...formData, id: tempId } as Consignatario;
      setConsignatarios(prev => [...prev, newData]);

      try {
        const newId = await addConsignatario(formData as Omit<Consignatario, 'id'>);
        setConsignatarios(prev => prev.map(c => c.id === tempId ? { ...newData, id: newId } : c));
        toast({ title: 'Éxito', description: 'Consignatario añadido correctamente.' });
      } catch (error) {
        setConsignatarios(prev => prev.filter(c => c.id !== tempId));
        console.error("Error adding consignatario:", error);
        toast({
          title: 'Error al Añadir',
          description: 'No se pudo añadir el consignatario. Revise la consola para más detalles.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteClick = (consignatario: Consignatario) => {
    setConsignatarioToDelete(consignatario);
  };

  const handleDeleteConfirm = async () => {
    if (!consignatarioToDelete) return;

    const originalData = [...consignatarios];
    const idToDelete = consignatarioToDelete.id;

    setConsignatarios(prev => prev.filter(c => c.id !== idToDelete));
    setConsignatarioToDelete(null);

    try {
      await deleteConsignatario(idToDelete);
      toast({ title: 'Éxito', description: 'Consignatario eliminado correctamente.' });
    } catch (error) {
      setConsignatarios(originalData);
      console.error("Error deleting consignatario:", error);
      toast({
        title: 'Error al Eliminar',
        description: 'No se pudo eliminar el consignatario. Revise la consola para más detalles.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Consignatarios</h2>
            <p className="text-muted-foreground">Administra los consignatarios.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Consignatario
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              e.preventDefault();
            }}>
            <DialogHeader>
              <DialogTitle>{editingConsignatario ? 'Editar Consignatario' : 'Añadir Nuevo Consignatario'}</DialogTitle>
            </DialogHeader>
            <ConsignatarioForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingConsignatario}
              paises={paises}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Consignatarios</CardTitle>
            <CardDescription>Un listado de todos tus consignatarios.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Consignatario</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consignatarios.map((consignatario) => (
                  <TableRow key={consignatario.id}>
                    <TableCell className="font-medium">{consignatario.nombre}</TableCell>
                    <TableCell>{consignatario.pais}</TableCell>
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
