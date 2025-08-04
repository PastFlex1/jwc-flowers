import { notFound } from 'next/navigation';
import { getInvoiceWithDetails } from '@/services/invoices';
import { InvoiceDetailView } from '@/app/invoices/[id]/invoice-detail-view';
import { v4 as uuidv4 } from 'uuid';

type InvoicePdfProps = {
  invoiceId: string;
};

// This is a React Server Component (RSC)
// It fetches its own data and can be rendered to HTML on the server.
export async function InvoicePdf({ invoiceId }: InvoicePdfProps) {
  const invoiceDetails = await getInvoiceWithDetails(invoiceId);

  if (!invoiceDetails) {
    notFound();
  }

  const { invoice, customer, consignatario, carguera, pais } = invoiceDetails;
  
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

  return <InvoiceDetailView 
    invoice={invoice} 
    customer={customer} 
    consignatario={consignatario}
    carguera={carguera}
    pais={pais}
  />;
}
