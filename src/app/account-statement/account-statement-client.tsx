
'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/context/app-data-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Customer, Invoice, CreditNote, DebitNote, BunchItem } from '@/lib/types';
import { AccountStatementView } from './account-statement-view';
import AccountStatementDownloadButton from './account-statement-download';
import SendDocumentsDialog from './send-documents-dialog'; // Import the new component

export type StatementData = {
  customer: Customer;
  invoices: (Invoice & { total: number; balance: number; credits: number; debits: number; payments: number })[];
  totalOutstanding: number;
  totalCredits: number;
  totalDebits: number;
  totalPayments: number;
  urgentPayment: number;
};

export function AccountStatementClient() {
  const { customers, invoices, creditNotes, debitNotes, payments } = useAppData();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  const statementData = useMemo((): StatementData | null => {
    if (!selectedCustomerId) return null;

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return null;

    const customerInvoices = invoices.filter(inv => inv.customerId === selectedCustomerId);

    const processedInvoices = customerInvoices.map(invoice => {
       const invoiceSubtotal = invoice.items.reduce((acc, item) => {
        if (!item.bunches) return acc;
        return acc + item.bunches.reduce((bunchAcc, bunch: BunchItem) => {
            const stems = bunch.stemsPerBunch * bunch.bunches;
            return bunchAcc + (stems * bunch.salePrice);
        }, 0);
      }, 0);

      const creditsForInvoice = creditNotes.filter(cn => cn.invoiceId === invoice.id);
      const debitsForInvoice = debitNotes.filter(dn => dn.invoiceId === invoice.id);
      const paymentsForInvoice = payments.filter(p => p.invoiceId === invoice.id);

      const totalCredits = creditsForInvoice.reduce((acc, note) => acc + note.amount, 0);
      const totalDebits = debitsForInvoice.reduce((acc, note) => acc + note.amount, 0);
      const totalPayments = paymentsForInvoice.reduce((acc, payment) => acc + payment.amount, 0);
      
      const totalCharge = invoiceSubtotal + totalDebits;
      const balance = totalCharge - totalCredits - totalPayments;

      return {
        ...invoice,
        total: totalCharge,
        credits: totalCredits,
        debits: totalDebits,
        payments: totalPayments,
        balance,
      };
    });
    
    const totalOutstanding = processedInvoices.reduce((acc, inv) => acc + inv.balance, 0);
    const totalCredits = processedInvoices.reduce((acc, inv) => acc + inv.credits, 0);
    const totalDebits = processedInvoices.reduce((acc, inv) => acc + inv.debits, 0);
    const totalPayments = processedInvoices.reduce((acc, inv) => acc + inv.payments, 0);

    const urgentPayment = processedInvoices
        .filter(inv => inv.status === 'Overdue')
        .reduce((acc, inv) => acc + inv.balance, 0);

    return {
      customer,
      invoices: processedInvoices.sort((a, b) => new Date(a.flightDate).getTime() - new Date(b.flightDate).getTime()),
      totalOutstanding,
      totalCredits,
      totalDebits,
      totalPayments,
      urgentPayment
    };
  }, [selectedCustomerId, customers, invoices, creditNotes, debitNotes, payments]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Estado de Cuenta</h2>
            <p className="text-muted-foreground">Seleccione un cliente para ver su estado de cuenta detallado.</p>
          </div>
          {statementData && (
             <div className="flex gap-2">
                <AccountStatementDownloadButton data={statementData} />
                <Button variant="outline" onClick={() => setIsSendDialogOpen(true)}>Enviar Documentos</Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Cliente</CardTitle>
            <CardDescription>Elija un cliente de la lista para generar su estado de cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="w-full md:w-1/2 lg:w-1/3">
                <SelectValue placeholder="Seleccione un cliente..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        {statementData && (
          <AccountStatementView data={statementData} />
        )}

        {!selectedCustomerId && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Por favor, seleccione un cliente para continuar.</p>
          </div>
        )}
      </div>
      
      {statementData && (
        <SendDocumentsDialog 
          isOpen={isSendDialogOpen}
          onClose={() => setIsSendDialogOpen(false)}
          customer={statementData.customer}
          invoices={statementData.invoices}
        />
      )}
    </>
  );
}
