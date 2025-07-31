import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/services/invoices';
import { getCustomerById } from '@/services/customers';
import { getConsignatarioById } from '@/services/consignatarios';
import { getCargueraById } from '@/services/cargueras';
import { getPaisById } from '@/services/paises';
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
  invoice.items.forEach(item => {
    if (!item.id) item.id = uuidv4();
    item.bunches.forEach(bunch => {
        if (!bunch.id) bunch.id = uuidv4();
    });
  });

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
