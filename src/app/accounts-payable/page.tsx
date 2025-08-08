import { getInvoices } from '@/services/invoices';
import { getCustomers } from '@/services/customers';
import { getCreditNotes } from '@/services/credit-notes';
import { getDebitNotes } from '@/services/debit-notes';
import { getPayments } from '@/services/payments';
import { getFincas } from '@/services/fincas';
import { DataHydrator } from '@/components/layout/data-hydrator';
import { AccountsPayableClient } from './accounts-payable-client';

export default async function AccountsPayablePage() {
  const [invoices, customers, creditNotes, debitNotes, payments, fincas] = await Promise.all([
    getInvoices(),
    getCustomers(),
    getCreditNotes(),
    getDebitNotes(),
    getPayments(),
    getFincas(),
  ]);

  return (
    <>
      <DataHydrator 
        invoices={invoices} 
        customers={customers} 
        creditNotes={creditNotes} 
        debitNotes={debitNotes}
        payments={payments}
        fincas={fincas}
      />
      <AccountsPayableClient />
    </>
  );
}
