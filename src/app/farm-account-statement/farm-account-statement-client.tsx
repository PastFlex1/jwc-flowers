
'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/context/app-data-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Finca, Invoice, CreditNote, DebitNote, BunchItem } from '@/lib/types';
import { FarmAccountStatementView } from './farm-account-statement-view';
import FarmAccountStatementDownloadButton from './farm-account-statement-download';
import SendFarmDocumentsDialog from './send-documents-dialog';

export type StatementData = {
  finca: Finca;
  invoices: (Invoice & { total: number; balance: number; credits: number; debits: number; payments: number })[];
  totalOutstanding: number;
  totalCredits: number;
  totalDebits: number;
  totalPayments: number;
  urgentPayment: number;
};

export function FarmAccountStatementClient() {
  const { fincas, invoices, creditNotes, debitNotes, payments } = useAppData();
  const [selectedFincaId, setSelectedFincaId] = useState<string | null>(null);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  const statementData = useMemo((): StatementData | null => {
    if (!selectedFincaId) return null;

    const finca = fincas.find(f => f.id === selectedFincaId);
    if (!finca) return null;

    const fincaInvoices = invoices.filter(inv => inv.farmId === selectedFincaId && inv.type === 'purchase');

    const processedInvoices = fincaInvoices.map(invoice => {
       const invoiceSubtotal = invoice.items.reduce((acc, item) => {
        if (!item.bunches) return acc;
        return acc + item.bunches.reduce((bunchAcc, bunch: BunchItem) => {
            const stems = bunch.stemsPerBunch * bunch.bunchesPerBox;
            return bunchAcc + (stems * bunch.purchasePrice);
        }, 0);
      }, 0);

      const creditsForInvoice = creditNotes.filter(cn => cn.invoiceId === invoice.id);
      const debitsForInvoice = debitNotes.filter(dn => dn.invoiceId === invoice.id);
      const paymentsForInvoice = payments.filter(p => p.invoiceId === invoice.id);

      const totalCredits = creditsForInvoice.reduce((acc, note) => acc + note.amount, 0);
      const totalDebits = debitsForInvoice.reduce((acc, note) => acc + note.amount, 0);
      const totalPayments = paymentsForInvoice.reduce((acc, payment) => payment.amount, 0);
      
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
      finca,
      invoices: processedInvoices.sort((a, b) => new Date(a.flightDate).getTime() - new Date(b.flightDate).getTime()),
      totalOutstanding,
      totalCredits,
      totalDebits,
      totalPayments,
      urgentPayment
    };
  }, [selectedFincaId, fincas, invoices, creditNotes, debitNotes, payments]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">Estado de Cuenta de Finca</h2>
            <p className="text-muted-foreground">Seleccione una finca para ver su estado de cuenta detallado.</p>
          </div>
          {statementData && (
             <div className="flex gap-2">
                <FarmAccountStatementDownloadButton data={statementData} />
                <Button variant="outline" onClick={() => setIsSendDialogOpen(true)}>Enviar Documentos</Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Finca</CardTitle>
            <CardDescription>Elija una finca/proveedor de la lista para generar su estado de cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedFincaId}>
              <SelectTrigger className="w-full md:w-1/2 lg:w-1/3">
                <SelectValue placeholder="Seleccione una finca..." />
              </SelectTrigger>
              <SelectContent>
                {fincas.map(finca => (
                  <SelectItem key={finca.id} value={finca.id}>
                    {finca.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        {statementData && (
          <FarmAccountStatementView data={statementData} />
        )}

        {!selectedFincaId && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Por favor, seleccione una finca para continuar.</p>
          </div>
        )}
      </div>
       
      {statementData && (
        <SendFarmDocumentsDialog 
          isOpen={isSendDialogOpen}
          onClose={() => setIsSendDialogOpen(false)}
          finca={statementData.finca}
          invoices={statementData.invoices}
        />
      )}
    </>
  );
}
