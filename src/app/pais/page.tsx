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
import { paises as initialPaises } from '@/lib/mock-data';
import type { Pais } from '@/lib/types';
import { PaisForm } from './pais-form';

export default function PaisPage() {
  const [paises, setPaises] = useState<Pais[]>(initialPaises);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPais, setEditingPais] = useState<Pais | null>(null);
  const [paisToDelete, setPaisToDelete] = useState<Pais | null>(null);

  const handleOpenDialog = (pais: Pais | null = null) => {
    setEditingPais(pais);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPais(null);
  };

  const handleFormSubmit = (paisData: Omit<Pais, 'id'> & { id?: string }) => {
    if (paisData.id) {
      setPaises(paises.map(p => p.id === paisData.id ? (paisData as Pais) : p));
    } else {
      const newPais: Pais = {
        id: `pais_${Date.now()}`,
        ...(paisData as Omit<Pais, 'id'>),
      };
      setPaises(prev => [...prev, newPais]);
    }
    handleCloseDialog();
  };

  const handleDeleteClick = (pais: Pais) => {
    setPaisToDelete(pais);
  };

  const handleDeleteConfirm = () => {
    if (paisToDelete) {
      setPaises(paises.filter(p => p.id !== paisToDelete.id));
      setPaisToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Países</h2>
            <p className="text-muted-foreground">Administra los países.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Añadir País
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
              e.preventDefault();
            }}>
            <DialogHeader>
              <DialogTitle>{editingPais ? 'Editar País' : 'Añadir Nuevo País'}</DialogTitle>
            </DialogHeader>
            <PaisForm 
              onSubmit={handleFormSubmit}
              onClose={handleCloseDialog}
              initialData={editingPais}
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
                {paises.map((pais) => (
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
