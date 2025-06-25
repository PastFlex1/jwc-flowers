import { notFound } from 'next/navigation';
import { customers, invoices, inventory } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { InvoiceMessageGenerator } from './invoice-message-generator';
import type { InvoiceMessageInput } from '@/ai/flows/invoice-message-generation';

type InvoiceDetailPageProps = {
  params: {
    id: string;
  };
};

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const invoice = invoices.find(inv => inv.id === params.id);
  if (!invoice) {
    notFound();
  }

  const customer = customers.find(c => c.id === invoice.customerId);
  const invoiceItems = invoice.items.map(item => {
    const details = inventory.find(i => i.id === item.itemId);
    return { ...item, ...details, total: (details?.price || 0) * item.quantity };
  });

  const subtotal = invoiceItems.reduce((acc, item) => acc + item.total, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const orderSummary = invoiceItems
    .map(item => `${item.quantity}x ${item.name}`)
    .join(', ');

  const aiMessageInput: InvoiceMessageInput | null = customer ? {
    customerName: customer.name,
    orderSummary,
    invoiceTotal: total,
    isFirstOrder: customer.isFirstOrder || false,
  } : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="p-4 sm:p-6 md:p-8">
        <CardHeader className="p-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold font-headline text-primary">INVOICE</h1>
              <p className="text-muted-foreground">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold font-headline">Bloom Invoice</h2>
              <p className="text-muted-foreground">123 Floral Ave, Petalburg, FL 12345</p>
            </div>
          </div>
          <Separator className="my-6" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Bill To:</h3>
              <address className="not-italic text-muted-foreground">
                {customer?.name}<br />
                {customer?.billingAddress.split(',').map(line => <div key={line}>{line.trim()}</div>)}<br />
                {customer?.email}
              </address>
            </div>
            <div className="text-right">
              <h3 className="font-semibold">Issue Date:</h3>
              <p className="text-muted-foreground">{invoice.issueDate}</p>
              <h3 className="font-semibold mt-2">Due Date:</h3>
              <p className="text-muted-foreground">{invoice.dueDate}</p>
            </div>
          </div>
          <div className="mt-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.description}</div>
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.price?.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Separator className="my-6" />
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {aiMessageInput && <InvoiceMessageGenerator input={aiMessageInput} />}
    </div>
  );
}
