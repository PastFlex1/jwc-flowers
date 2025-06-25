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
import { marcaciones as initialMarcaciones } from '@/lib/mock-data';
import type { Marcacion } from '@/lib/types';
import { MarcacionForm } from './marcacion-form';

export default function MarcacionPage() {
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>(initialMarcaciones);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMarcacion, setEditingMarcacion] = useState<Marcacion | null>(null);
  const [marcacionToDelete, setMarcacionToDelete] = useState<Marcacion | null>(null);

  const handleOpenDialog = (marcacion: Marcacion | null = null) => {
    setEditingMarcacion(marcacion);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMarcacion(null);
  };

  const handleFormSubmit = (marcacionData: Omit<Marcacion, 'id'> & { id?: string }) => {
    if (marcacionData.id) {
      setMarcaciones(marcaciones.map(m => m.id === marcacionData.id ? (marcacionData as Marcacion) : m));
    } else {
      const newMarcacion: Marcacion = {
        id: `mar_${Date.now()}`,
        ...(marcacionData as Omit<Marcacion, 'id'>),
      };
      setMarcaciones(prev => [...prev, newMarcacion]);
    }
    handleCloseDialog();
  };

  const handleDeleteClick = (marcacion: Marcacion) => {
    setMarcacionToDelete(marcacion);
  };

  const handleDeleteConfirm = () => {
    if (marcacionToDelete) {
      setMarcaciones(marcaciones.filter(m => m.id !== marcacionToDelete.id));
      setMarcacionToDelete(null);
    }
  };

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
                {marcaciones.map((marcacion) => (
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
