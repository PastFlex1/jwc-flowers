'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { fincas as initialFincas } from '@/lib/mock-data';
import type { Finca } from '@/lib/types';
import { FincaForm } from './finca-form';

export default function FincasPage() {
  const [fincas, setFincas] = useState<Finca[]>(initialFincas);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddFinca = (newFincaData: Omit<Finca, 'id'>) => {
    const newFinca: Finca = {
      id: `finca_${Date.now()}`,
      ...newFincaData,
    };
    setFincas(prev => [...prev, newFinca]);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Fincas</h2>
          <p className="text-muted-foreground">Administra las fincas proveedoras.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Añadir Finca
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Añadir Nueva Finca</DialogTitle>
            </DialogHeader>
            <FincaForm onSubmit={handleAddFinca} />
          </DialogContent>
        </Dialog>
      </div>

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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
