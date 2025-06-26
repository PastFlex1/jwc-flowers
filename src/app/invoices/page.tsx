'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
// Note: In a real app, you wouldn't fetch all customers just to display names.
// You would either store the customer name on the invoice document (denormalization)
// or have a more specific backend query. For this migration, we'll fetch all.
import { getCustomers } from '@/services/customers';
// import { getInvoices } from '@/services/invoices';
import type { Customer, Invoice } from '@/lib/types';
import { invoices as mockInvoices } from '@/lib/mock-data'; // TEMPORARY

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // const [invoicesData, customersData] = await Promise.all([
      //   getInvoices(),
      //   getCustomers(),
      // ]);
      // setInvoices(invoicesData);
      // setCustomers(customersData);
      
      // FIXME: Using mock invoices until service is fully implemented
      const customersData = await getCustomers();
      setInvoices(mockInvoices);
      setCustomers(customersData);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las facturas o clientes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'Cliente Desconocido';
  };

  const getInvoiceTotal = (invoice: Invoice) => {
    if (!invoice.items) return 0;
    return invoice.items.reduce((total, item) => {
      // This is a simplified calculation. The old mock data had different structure.
      const itemTotal = (item.salePrice || 0) * (item.stemCount || 0);
      return total + itemTotal;
    }, 0);
  };
  
  const renderSkeleton = () => (
     Array.from({ length: 3 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
      </TableRow>
    ))
  );

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
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Flight Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? renderSkeleton() : invoices.map((invoice) => {
                const total = getInvoiceTotal(invoice);
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                        #{invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
                    <TableCell>{invoice.flightDate}</TableCell>
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
                    <TableCell>
                      <Link href={`/invoices/${invoice.id}`} passHref>
                        <Button variant="ghost" size="sm">View</Button>
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
