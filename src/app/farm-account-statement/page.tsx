import { getInvoices } from '@/services/invoices';
import { getFincas } from '@/services/fincas';
import { getCreditNotes } from '@/services/credit-notes';
import { getDebitNotes } from '@/services/debit-notes';
import { getPayments } from '@/services/payments';
import { DataHydrator } from '@/components/layout/data-hydrator';
import { FarmAccountStatementClient } from './farm-account-statement-client';

export default async function FarmAccountStatementPage() {
  const [invoices, fincas, creditNotes, debitNotes, payments] = await Promise.all([
    getInvoices(),
    getFincas(),
    getCreditNotes(),
    getDebitNotes(),
    getPayments(),
  ]);

  return (
    <>
      <DataHydrator 
        invoices={invoices} 
        fincas={fincas}
        creditNotes={creditNotes} 
        debitNotes={debitNotes}
        payments={payments}
      />
      <FarmAccountStatementClient />
    </>
  );
}
