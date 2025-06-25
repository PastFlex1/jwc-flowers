'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle } from 'lucide-react';
import { customers, inventory } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

const lineItemSchema = z.object({
  itemId: z.string().min(1, 'Please select an item.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer.'),
  items: z.array(lineItemSchema).min(1, 'Please add at least one item.'),
});

export default function NewInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      items: [{ itemId: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');
  const subtotal = watchItems.reduce((acc, currentItem) => {
    const item = inventory.find(i => i.id === currentItem.itemId);
    return acc + (item ? item.price * currentItem.quantity : 0);
  }, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  function onSubmit(values: z.infer<typeof invoiceSchema>) {
    console.log(values);
    toast({
      title: 'Invoice Created!',
      description: 'The new invoice has been successfully saved.',
    });
    router.push('/');
  }

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">New Invoice</h2>
          <p className="text-muted-foreground">Create a new invoice for a customer.</p>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
              <CardDescription>Add products and services to this invoice.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-[100px]">Qty</TableHead>
                    <TableHead className="w-[150px]">Unit Price</TableHead>
                    <TableHead className="w-[150px] text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const selectedItem = inventory.find(i => i.id === watchItems[index]?.itemId);
                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.itemId`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an item" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {inventory.map(item => (
                                      <SelectItem key={item.id} value={item.id}>
                                        {item.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>${selectedItem?.price.toFixed(2) || '0.00'}</TableCell>
                        <TableCell className="text-right">
                          ${( (selectedItem?.price || 0) * (watchItems[index]?.quantity || 0) ).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => append({ itemId: '', quantity: 1 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/')}>
              Cancel
            </Button>
            <Button type="submit">Create Invoice</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
