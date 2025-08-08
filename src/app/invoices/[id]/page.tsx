import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/services/invoices';
import { getCustomerById } from '@/services/customers';
import { getConsignatarioById } from '@/services/consignatarios';
import { getCargueraById } from '@/services/cargueras';
import { getPaisById } from '@/services/paises';
import { getPaymentsForInvoice } from '@/services/payments';
import { getCreditNotesForInvoice } from '@/services/credit-notes';
import { getDebitNotesForInvoice } from '@/services/debit-notes';
import { InvoiceDetailView } from './invoice-detail-view';
import { v4 as uuidv4 } from 'uuid';

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
  
  // Ensure items and bunches have IDs for client-side key props
  if (invoice.items && Array.isArray(invoice.items)) {
    invoice.items.forEach(item => {
      if (!item.id) item.id = uuidv4();
      if (item.bunches && Array.isArray(item.bunches)) {
        item.bunches.forEach(bunch => {
            if (!bunch.id) bunch.id = uuidv4();
        });
      }
    });
  }


  const [
    customer, 
    consignatario, 
    carguera, 
    pais, 
    payments,
    creditNotes,
    debitNotes,
  ] = await Promise.all([
      getCustomerById(invoice.customerId),
      invoice.consignatarioId ? getConsignatarioById(invoice.consignatarioId) : null,
      invoice.carrierId ? getCargueraById(invoice.carrierId) : null,
      invoice.countryId ? getPaisById(invoice.countryId) : null,
      getPaymentsForInvoice(invoice.id),
      getCreditNotesForInvoice(invoice.id),
      getDebitNotesForInvoice(invoice.id)
  ]);
  
  const financials = { payments, creditNotes, debitNotes };


  return <InvoiceDetailView 
    invoice={invoice} 
    customer={customer} 
    consignatario={consignatario}
    carguera={carguera}
    pais={pais}
    financials={financials}
  />;
}
