import { getInvoices } from '@/services/invoices';
import { getCustomers } from '@/services/customers';
import { getCreditNotes } from '@/services/credit-notes';
import { getDebitNotes } from '@/services/debit-notes';
import { getPayments } from '@/services/payments';
import { DataHydrator } from '@/components/layout/data-hydrator';
import { InvoicesClient } from './invoices-client';

export default async function InvoicesPage() {
  const [invoices, customers, creditNotes, debitNotes, payments] = await Promise.all([
    getInvoices(),
    getCustomers(),
    getCreditNotes(),
    getDebitNotes(),
    getPayments(),
  ]);

  return (
    <>
      <DataHydrator 
        invoices={invoices} 
        customers={customers} 
        creditNotes={creditNotes} 
        debitNotes={debitNotes}
        payments={payments}
      />
      <InvoicesClient />
    </>
  );
}
