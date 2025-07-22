'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/context/app-data-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Customer, Invoice, CreditNote, DebitNote } from '@/lib/types';
import { AccountStatementView } from './account-statement-view';
import AccountStatementDownloadButton from './account-statement-download';

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
  const { customers, invoices, creditNotes, debitNotes } = useAppData();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const statementData = useMemo((): StatementData | null => {
    if (!selectedCustomerId) return null;

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return null;

    const customerInvoices = invoices.filter(inv => inv.customerId === selectedCustomerId);

    const processedInvoices = customerInvoices.map(invoice => {
      const invoiceSubtotal = invoice.items.reduce((acc, item) => {
        const stems = (item.stemCount || 0) * (item.bunchesPerBox || 0);
        return acc + stems * (item.salePrice || 0);
      }, 0);

      const creditsForInvoice = creditNotes.filter(cn => cn.invoiceId === invoice.id);
      const debitsForInvoice = debitNotes.filter(dn => dn.invoiceId === invoice.id);

      const totalCredits = creditsForInvoice.reduce((acc, note) => acc + note.amount, 0);
      const totalDebits = debitsForInvoice.reduce((acc, note) => acc + note.amount, 0);
      
      const totalCharge = invoiceSubtotal + totalDebits;
      
      // NOTE: Payment logic is simulated as there's no payment data model yet.
      // For now, we assume nothing has been paid.
      const payments = 0; 
      const balance = totalCharge - totalCredits - payments;

      return {
        ...invoice,
        total: totalCharge,
        credits: totalCredits,
        debits: totalDebits,
        payments,
        balance,
      };
    });
    
    const totalOutstanding = processedInvoices.reduce((acc, inv) => acc + inv.balance, 0);
    const totalCredits = processedInvoices.reduce((acc, inv) => acc + inv.credits, 0);
    const totalDebits = processedInvoices.reduce((acc, inv) => acc + inv.debits, 0);
    const totalPayments = processedInvoices.reduce((acc, inv) => acc + inv.payments, 0);

    // Placeholder for urgent payment logic
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
  }, [selectedCustomerId, customers, invoices, creditNotes, debitNotes]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Estado de Cuenta</h2>
          <p className="text-muted-foreground">Seleccione un cliente para ver su estado de cuenta detallado.</p>
        </div>
        {statementData && <AccountStatementDownloadButton data={statementData} />}
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
  );
}
