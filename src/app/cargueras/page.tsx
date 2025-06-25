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
import { cargueras as initialCargueras } from '@/lib/mock-data';
import type { Carguera } from '@/lib/types';
import { CargueraForm } from './carguera-form';

export default function CarguerasPage() {
  const [cargueras, setCargueras] = useState<Carguera[]>(initialCargueras);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCarguera, setEditingCarguera] = useState<Carguera | null>(null);
  const [cargueraToDelete, setCargueraToDelete] = useState<Carguera | null>(null);

  const handleOpenDialog = (carguera: Carguera | null = null) => {
    setEditingCarguera(carguera);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCarguera(null);
  };

  const handleFormSubmit = (cargueraData: Omit<Carguera, 'id'> & { id?: string }) => {
    if (cargueraData.id) {
      setCargueras(cargueras.map(c => c.id === cargueraData.id ? (cargueraData as Carguera) : c));
    } else {
      const newCarguera: Carguera = {
        id: `car_${Date.now()}`,
        ...(cargueraData as Omit<Carguera, 'id'>),
      };
      setCargueras(prev => [...prev, newCarguera]);
    }
    handleCloseDialog();
  };

  const handleDeleteClick = (carguera: Carguera) => {
    setCargueraToDelete(carguera);
  };

  const handleDeleteConfirm = () => {
    if (cargueraToDelete) {
      setCargueras(cargueras.filter(c => c.id !== cargueraToDelete.id));
      setCargueraToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Cargueras</h2>
            <p className="text-muted-foreground">Administra las cargueras.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Carguera
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              e.preventDefault();
            }}>
            <DialogHeader>
              <DialogTitle>{editingCarguera ? 'Editar Carguera' : 'Añadir Nueva Carguera'}</DialogTitle>
            </DialogHeader>
            <CargueraForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingCarguera}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Cargueras</CardTitle>
            <CardDescription>Un listado de todas tus cargueras.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre de la Carguera</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargueras.map((carguera) => (
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
        </Card>
      </div>

      <AlertDialog open={!!cargueraToDelete} onOpenChange={(open) => !open && setCargueraToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la carguera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCargueraToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
