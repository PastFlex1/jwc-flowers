'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { inventory as initialInventory } from '@/lib/mock-data';
import type { InventoryItem } from '@/lib/types';
import { ItemForm } from './item-form';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddItem = (newItemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      id: `item_${Date.now()}`,
      ...newItemData,
    };
    setInventory(prev => [...prev, newItem]);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Inventory</h2>
          <p className="text-muted-foreground">Manage your products and services.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
            </DialogHeader>
            <ItemForm onSubmit={handleAddItem} />
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
