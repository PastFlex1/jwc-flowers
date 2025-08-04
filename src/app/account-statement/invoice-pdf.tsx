
import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/services/invoices';
import { getCustomerById } from '@/services/customers';
import { getConsignatarioById } from '@/services/consignatarios';
import { getCargueraById } from '@/services/cargueras';
import { getPaisById } from '@/services/paises';
import { InvoiceDetailView } from '@/app/invoices/[id]/invoice-detail-view';
import { v4 as uuidv4 } from 'uuid';

type InvoicePdfProps = {
  invoiceId: string;
};

// This is a React Server Component (RSC)
// It fetches its own data and can be rendered to HTML on the server.
export async function InvoicePdf({ invoiceId }: InvoicePdfProps) {
  const invoice = await getInvoiceById(invoiceId);

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

  const customer = await getCustomerById(invoice.customerId);
  const consignatario = invoice.consignatarioId 
    ? await getConsignatarioById(invoice.consignatarioId) 
    : null;
  const carguera = invoice.carrierId ? await getCargueraById(invoice.carrierId) : null;
  const pais = invoice.countryId ? await getPaisById(invoice.countryId) : null;

  return <InvoiceDetailView 
    invoice={invoice} 
    customer={customer} 
    consignatario={consignatario}
    carguera={carguera}
    pais={pais}
  />;
}
