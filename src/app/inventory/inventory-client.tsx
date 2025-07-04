
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getInventoryItems, addInventoryItem } from '@/services/inventory';
import type { InventoryItem } from '@/lib/types';
import { ItemForm } from './item-form';
import { useTranslation } from '@/context/i18n-context';

export function InventoryClient() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchItems = useCallback(async () => {
    try {
      const items = await getInventoryItems();
      setInventory(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudo cargar el inventario. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);


  const handleAddItem = async (newItemData: Omit<InventoryItem, 'id'>) => {
    setIsDialogOpen(false);
    const tempId = `temp-${Date.now()}`;
    const newItem = { ...newItemData, id: tempId };
    setInventory(prev => [...prev, newItem]);

    try {
      const newId = await addInventoryItem(newItemData);
      setInventory(prev => prev.map(item => item.id === tempId ? { ...newItem, id: newId } : item));
      toast({ title: 'Éxito', description: 'Ítem añadido correctamente.' });
    } catch (error) {
      setInventory(prev => prev.filter(item => item.id !== tempId));
      console.error("Error adding item:", error);
      toast({
        title: 'Error al Añadir',
        description: 'No se pudo añadir el ítem. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">{t('inventory.title')}</h2>
          <p className="text-muted-foreground">{t('inventory.description')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> {t('inventory.newItem')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
            </DialogHeader>
            <ItemForm onSubmit={handleAddItem} onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
          <CardDescription>All your available products and services.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>${item.cost.toFixed(2)}</TableCell>
                  <TableCell>${(item.price - item.cost).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
