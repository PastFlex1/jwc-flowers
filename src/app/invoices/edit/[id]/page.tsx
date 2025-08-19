import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/services/invoices';
import { NewInvoiceForm, type InvoiceFormValues } from '@/app/invoices/new/new-invoice-form';
import { v4 as uuidv4 } from 'uuid';
import { parseISO } from 'date-fns';

type EditInvoicePageProps = {
  params: {
    id: string;
  };
};

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const invoiceToEdit = await getInvoiceById(params.id);

  if (!invoiceToEdit) {
    notFound();
  }

  const initialData: Partial<InvoiceFormValues> = {
    ...invoiceToEdit,
    farmDepartureDate: invoiceToEdit.farmDepartureDate ? parseISO(invoiceToEdit.farmDepartureDate) : new Date(),
    flightDate: invoiceToEdit.flightDate ? parseISO(invoiceToEdit.flightDate) : new Date(),
    items: invoiceToEdit.items.map(item => ({
      ...item,
      id: uuidv4(),
      numberOfBunches: item.numberOfBunches,
      bunches: item.bunches.map(bunch => ({
        ...bunch,
        id: uuidv4(),
      })),
    })),
  };

  return <NewInvoiceForm initialData={initialData} isEditing={true} />;
}
