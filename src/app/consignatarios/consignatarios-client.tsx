'use client';

import { useState } from 'react';
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
import type { Consignatario, Pais, Customer } from '@/lib/types';
import { ConsignatarioForm } from './consignatario-form';

type ConsignatarioFormData = Omit<Consignatario, 'id'> & { id?: string };

type ConsignatariosClientProps = {
  initialConsignatarios: Consignatario[];
  paises: Pais[];
  customers: Customer[];
  customerMap: Record<string, string>;
};

export function ConsignatariosClient({
  initialConsignatarios,
  paises,
  customers,
  customerMap: initialCustomerMap
}: ConsignatariosClientProps) {
  const [consignatarios, setConsignatarios] = useState<Consignatario[]>(initialConsignatarios);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>(initialCustomerMap);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConsignatario, setEditingConsignatario] = useState<Consignatario | null>(null);
  const [consignatarioToDelete, setConsignatarioToDelete] = useState<Consignatario | null>(null);
  const { toast } = useToast();

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
    const originalConsignatarios = [...consignatarios];

    if (formData.id) {
        // Optimistic update
        const updatedConsignatarios = consignatarios.map((c) =>
            c.id === formData.id ? { ...c, ...(formData as Consignatario) } : c
        );
        setConsignatarios(updatedConsignatarios);
        
        try {
            await updateConsignatario(formData.id, formData as Consignatario);
            toast({ title: 'Éxito', description: 'Consignatario actualizado correctamente.' });
        } catch (error) {
            setConsignatarios(originalConsignatarios);
            console.error("Error updating consignatario:", error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast({
                title: 'Error al Actualizar',
                description: `No se pudo actualizar el consignatario: ${errorMessage}.`,
                variant: 'destructive',
                duration: 10000,
            });
        }
    } else {
        // Optimistic add
        const tempId = `temp-${Date.now()}`;
        const newConsignatario = { ...formData, id: tempId } as Consignatario;
        setConsignatarios(prev => [...prev, newConsignatario]);

        try {
            const newId = await addConsignatario(formData as Omit<Consignatario, 'id'>);
            setConsignatarios(prev => prev.map(c => c.id === tempId ? { ...newConsignatario, id: newId } : c));
            toast({ title: 'Éxito', description: 'Consignatario añadido correctamente.' });
        } catch (error) {
            setConsignatarios(originalConsignatarios);
            console.error("Error adding consignatario:", error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            toast({
                title: 'Error al Añadir',
                description: `No se pudo añadir el consignatario: ${errorMessage}.`,
                variant: 'destructive',
                duration: 10000,
            });
        }
    }
  };

  const handleDeleteClick = (consignatario: Consignatario) => {
    setConsignatarioToDelete(consignatario);
  };

  const handleDeleteConfirm = async () => {
    if (!consignatarioToDelete) return;

    const originalConsignatarios = [...consignatarios];
    const idToDelete = consignatarioToDelete.id;

    // Optimistic delete
    setConsignatarios(prev => prev.filter(c => c.id !== idToDelete));
    setConsignatarioToDelete(null);

    try {
      await deleteConsignatario(idToDelete);
      toast({ title: 'Éxito', description: 'Consignatario eliminado correctamente.' });
    } catch (error) {
        setConsignatarios(originalConsignatarios);
        console.error("Error deleting consignatario:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast({
          title: 'Error al Eliminar',
          description: `No se pudo eliminar el consignatario: ${errorMessage}.`,
          variant: 'destructive',
          duration: 10000,
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
                  <TableHead>Cliente Dirigido</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consignatarios.map((consignatario) => (
                  <TableRow key={consignatario.id}>
                    <TableCell className="font-medium">{consignatario.nombreConsignatario}</TableCell>
                    <TableCell>{customerMap[consignatario.customerId] || 'N/A'}</TableCell>
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
