import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/services/invoices';
import { getCustomerById } from '@/services/customers';
import { getConsignatarioById } from '@/services/consignatarios';
import { InvoiceDetailView } from './invoice-detail-view';

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

  const customer = await getCustomerById(invoice.customerId);
  const consignatario = invoice.consignatarioId 
    ? await getConsignatarioById(invoice.consignatarioId) 
    : null;

  return <InvoiceDetailView invoice={invoice} customer={customer} consignatario={consignatario} />;
}
