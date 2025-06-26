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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getMarcaciones, addMarcacion, updateMarcacion, deleteMarcacion } from '@/services/marcaciones';
import type { Marcacion } from '@/lib/types';
import { MarcacionForm } from './marcacion-form';

type MarcacionFormData = Omit<Marcacion, 'id'> & { id?: string };

export function MarcacionClient() {
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMarcacion, setEditingMarcacion] = useState<Marcacion | null>(null);
  const [marcacionToDelete, setMarcacionToDelete] = useState<Marcacion | null>(null);
  const { toast } = useToast();

  const fetchMarcaciones = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMarcaciones();
      setMarcaciones(data);
    } catch (error) {
      console.error("Error fetching marcaciones:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar las marcaciones. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchMarcaciones();
  }, [fetchMarcaciones]);

  const handleOpenDialog = (marcacion: Marcacion | null = null) => {
    setEditingMarcacion(marcacion);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMarcacion(null);
  };

  const handleFormSubmit = async (marcacionData: MarcacionFormData) => {
    try {
      if (marcacionData.id) {
        await updateMarcacion(marcacionData.id, marcacionData);
        setMarcaciones(prev => prev.map(m => m.id === marcacionData.id ? (marcacionData as Marcacion) : m));
        toast({ title: 'Éxito', description: 'Marcación actualizada correctamente.' });
      } else {
        const newId = await addMarcacion(marcacionData as Omit<Marcacion, 'id'>);
        setMarcaciones(prev => [...prev, { ...marcacionData, id: newId } as Marcacion]);
        toast({ title: 'Éxito', description: 'Marcación añadida correctamente.' });
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la marcación.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (marcacion: Marcacion) => {
    setMarcacionToDelete(marcacion);
  };

  const handleDeleteConfirm = async () => {
    if (marcacionToDelete) {
      try {
        await deleteMarcacion(marcacionToDelete.id);
        setMarcaciones(prev => prev.filter(m => m.id !== marcacionToDelete.id));
        toast({ title: 'Éxito', description: 'Marcación eliminada correctamente.' });
        setMarcacionToDelete(null);
      } catch (error) {
        console.error("Error deleting marcación:", error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la marcación.',
          variant: 'destructive',
        });
      }
    }
  };
  
  const renderSkeleton = () => (
    Array.from({ length: 3 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
        <TableCell className="text-right space-x-0">
          <Skeleton className="h-8 w-8 inline-block" />
          <Skeleton className="h-8 w-8 inline-block ml-2" />
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Marcación</h2>
            <p className="text-muted-foreground">Administra las marcaciones.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Marcación
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              e.preventDefault();
            }}>
            <DialogHeader>
              <DialogTitle>{editingMarcacion ? 'Editar Marcación' : 'Añadir Nueva Marcación'}</DialogTitle>
            </DialogHeader>
            <MarcacionForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingMarcacion}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Marcaciones</CardTitle>
            <CardDescription>Un listado de todas tus marcaciones.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Marcación</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? renderSkeleton() : marcaciones.map((marcacion) => (
                  <TableRow key={marcacion.id}>
                    <TableCell className="font-medium">{marcacion.numeroMarcacion}</TableCell>
                    <TableCell>{marcacion.cliente}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(marcacion)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(marcacion)}>
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

      <AlertDialog open={!!marcacionToDelete} onOpenChange={(open) => !open && setMarcacionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la marcación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMarcacionToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
