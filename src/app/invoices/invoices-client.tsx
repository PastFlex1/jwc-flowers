'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Invoice } from '@/lib/types';
import { format, parseISO } from 'date-fns';

type InvoicesClientProps = {
  initialInvoices: Invoice[];
  customerMap: Record<string, string>;
};

export function InvoicesClient({ initialInvoices, customerMap }: InvoicesClientProps) {
  const [invoices] = useState<Invoice[]>(initialInvoices);
  const [customers] = useState<Record<string, string>>(customerMap);

  const getCustomerName = (customerId: string) => {
    return customers[customerId] || 'Cliente Desconocido';
  };

  const getInvoiceTotal = (invoice: Invoice) => {
    if (!invoice.items) return 0;
    const subtotal = invoice.items.reduce((total, item) => {
      const itemTotal = (item.salePrice || 0) * (item.stemCount || 0);
      return total + itemTotal;
    }, 0);
    const tax = subtotal * 0.12;
    return subtotal + tax;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Invoices</h2>
          <p className="text-muted-foreground">Manage and track your customer invoices.</p>
        </div>
        <Link href="/invoices/new" passHref>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>A list of all your past and present invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Flight Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const total = getInvoiceTotal(invoice);
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link href={`/invoices/${invoice.id}`} className="hover:underline text-primary">
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
                    <TableCell>{format(parseISO(invoice.flightDate), 'PPP')}</TableCell>
                    <TableCell>${total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={invoice.status === 'Paid' ? 'secondary' : invoice.status === 'Overdue' ? 'destructive' : 'outline'}
                        className={cn({
                          'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': invoice.status === 'Paid',
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': invoice.status === 'Pending',
                        })}
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/invoices/${invoice.id}`} passHref>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
