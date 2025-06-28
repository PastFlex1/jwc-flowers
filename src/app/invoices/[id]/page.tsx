import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { InvoiceMessageGenerator } from './invoice-message-generator';
import type { InvoiceMessageInput } from '@/ai/flows/invoice-message-generation';
import { getInvoiceById } from '@/services/invoices';
import { getCustomerById } from '@/services/customers';
import { getConsignatarioById } from '@/services/consignatarios';
import { format, parseISO } from 'date-fns';

type InvoiceDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const invoice = await getInvoiceById(params.id);

  if (!invoice) {
    notFound();
  }

  const customer = await getCustomerById(invoice.customerId);
  const consignatario = invoice.consignatarioId 
    ? await getConsignatarioById(invoice.consignatarioId) 
    : null;

  const subtotal = invoice.items.reduce((acc, item) => acc + (item.salePrice * item.stemCount), 0);
  const tax = subtotal * 0.12; // Standard VAT in Ecuador
  const total = subtotal + tax;

  const orderSummary = invoice.items
    .map(item => `${item.stemCount}x ${item.description}`)
    .join(', ');

  const aiMessageInput: InvoiceMessageInput | null = customer ? {
    customerName: customer.name,
    orderSummary,
    invoiceTotal: total,
    isFirstOrder: false,
  } : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="p-4 sm:p-6 md:p-8">
        <CardHeader className="p-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold font-headline text-primary">INVOICE</h1>
              <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold font-headline">JCW Flowers</h2>
              <p className="text-muted-foreground">Cayambe, Ecuador</p>
            </div>
          </div>
          <Separator className="my-6" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Bill To:</h3>
              <address className="not-italic text-muted-foreground">
                <div>{consignatario ? consignatario.nombreConsignatario : customer?.name}</div>
                  {consignatario ? (
                    <>
                      <div>{consignatario.direccion}</div>
                      <div>{`${consignatario.provincia}, ${consignatario.pais}`}</div>
                    </>
                  ) : (
                    customer?.address.split(',').map(line => <div key={line}>{line.trim()}</div>)
                  )}
                  {customer?.email && <div>{customer.email}</div>}
              </address>
            </div>
            <div className="text-right">
              <h3 className="font-semibold">Issue Date:</h3>
              <p className="text-muted-foreground">{format(parseISO(invoice.farmDepartureDate), 'PPP')}</p>
              <h3 className="font-semibold mt-2">Due Date:</h3>
              <p className="text-muted-foreground">{format(parseISO(invoice.flightDate), 'PPP')}</p>
            </div>
          </div>
          <div className="mt-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Cajas</TableHead>
                  <TableHead className="text-center">Tallos</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.boxCount} {item.boxType.toUpperCase()} / {item.bunchCount} Bunches / {item.length}cm
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{item.boxCount}</TableCell>
                    <TableCell className="text-center">{item.stemCount}</TableCell>
                    <TableCell className="text-right">${item.salePrice?.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${(item.salePrice * item.stemCount).toFixed(2)}</TableCell>
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
                <span className="text-muted-foreground">IVA (12%)</span>
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
