import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { customers, invoices, inventory } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function InvoicesPage() {
  const getInvoiceTotal = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return 0;
    return invoice.items.reduce((total, item) => {
      const inventoryItem = inventory.find(i => i.id === item.itemId);
      return total + (inventoryItem?.price || 0) * item.quantity;
    }, 0);
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
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const customer = customers.find(c => c.id === invoice.customerId);
                const total = getInvoiceTotal(invoice.id);
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                        #{invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{customer?.name || 'Unknown'}</TableCell>
                    <TableCell>{invoice.issueDate}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
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
