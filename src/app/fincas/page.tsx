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
import { fincas as initialFincas } from '@/lib/mock-data';
import type { Finca } from '@/lib/types';
import { FincaForm } from './finca-form';

export default function FincasPage() {
  const [fincas, setFincas] = useState<Finca[]>(initialFincas);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFinca, setEditingFinca] = useState<Finca | null>(null);
  const [fincaToDelete, setFincaToDelete] = useState<Finca | null>(null);

  const handleOpenDialog = (finca: Finca | null = null) => {
    setEditingFinca(finca);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFinca(null);
  };

  const handleFormSubmit = (fincaData: Omit<Finca, 'id'> & { id?: string }) => {
    if (fincaData.id) {
      setFincas(fincas.map(f => f.id === fincaData.id ? (fincaData as Finca) : f));
    } else {
      const newFinca: Finca = {
        id: `finca_${Date.now()}`,
        ...(fincaData as Omit<Finca, 'id'>),
      };
      setFincas(prev => [...prev, newFinca]);
    }
    handleCloseDialog();
  };

  const handleDeleteClick = (finca: Finca) => {
    setFincaToDelete(finca);
  };

  const handleDeleteConfirm = () => {
    if (fincaToDelete) {
      setFincas(fincas.filter(f => f.id !== fincaToDelete.id));
      setFincaToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Fincas</h2>
            <p className="text-muted-foreground">Administra las fincas proveedoras.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir Finca
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              e.preventDefault();
            }}>
            <DialogHeader>
              <DialogTitle>{editingFinca ? 'Editar Finca' : 'Añadir Nueva Finca'}</DialogTitle>
            </DialogHeader>
            <FincaForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingFinca}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Fincas</CardTitle>
            <CardDescription>Un listado de todas tus fincas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Tax ID / RUC</TableHead>
                  <TableHead>Tipo de Producto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fincas.map((finca) => (
                  <TableRow key={finca.id}>
                    <TableCell className="font-medium">{finca.name}</TableCell>
                    <TableCell>{finca.address}</TableCell>
                    <TableCell>{finca.phone}</TableCell>
                    <TableCell>{finca.taxId}</TableCell>
                    <TableCell>{finca.productType}</TableCell>
                    <TableCell className="text-right space-x-0">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(finca)}>
                           <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(finca)}>
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

      <AlertDialog open={!!fincaToDelete} onOpenChange={(open) => !open && setFincaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la finca de tus registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFincaToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
