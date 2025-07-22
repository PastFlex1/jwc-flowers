import { getInvoices } from '@/services/invoices';
import { getCustomers } from '@/services/customers';
import { getCreditNotes } from '@/services/credit-notes';
import { DataHydrator } from '@/components/layout/data-hydrator';
import { InvoicesClient } from './invoices-client';

export default async function InvoicesPage() {
  const [invoices, customers, creditNotes] = await Promise.all([
    getInvoices(),
    getCustomers(),
    getCreditNotes()
  ]);

  return (
    <>
      <DataHydrator 
        invoices={invoices} 
        customers={customers} 
        creditNotes={creditNotes} 
      />
      <InvoicesClient />
    </>
  );
}
