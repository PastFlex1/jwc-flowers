
import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/services/invoices';
import { NewInvoiceForm, type InvoiceFormValues } from '../new/new-invoice-form';
import { v4 as uuidv4 } from 'uuid';
import { parseISO } from 'date-fns';

type DuplicateInvoicePageProps = {
  params: {
    id: string;
  };
};

export default async function DuplicateInvoicePage({ params }: DuplicateInvoicePageProps) {
  const invoiceToDuplicate = await getInvoiceById(params.id);

  if (!invoiceToDuplicate) {
    notFound();
  }

  const initialData: Partial<InvoiceFormValues> = {
    ...invoiceToDuplicate,
    invoiceNumber: '', // Clear the invoice number for a new one
    farmDepartureDate: invoiceToDuplicate.farmDepartureDate ? parseISO(invoiceToDuplicate.farmDepartureDate) : new Date(),
    flightDate: invoiceToDuplicate.flightDate ? parseISO(invoiceToDuplicate.flightDate) : new Date(),
    items: invoiceToDuplicate.items.map(item => ({
      ...item,
      id: uuidv4(),
      bunches: item.bunches.map(bunch => ({
        ...bunch,
        id: uuidv4(),
        numberOfBunches: item.numberOfBunches,
      })),
    })),
  };

  return <NewInvoiceForm initialData={initialData} />;
}
