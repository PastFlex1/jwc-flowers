

import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/services/invoices';
import { NewInvoiceForm, type InvoiceFormValues } from '@/app/invoices/new/new-invoice-form';
import { v4 as uuidv4 } from 'uuid';
import { parseISO } from 'date-fns';
import { Suspense } from 'react';

type DuplicateInvoicePageProps = {
  params: {
    id: string;
  };
};

// This is a server component to fetch the initial data
export default async function DuplicateInvoicePage({ params }: DuplicateInvoicePageProps) {
  
  // This page can be removed if duplication is handled entirely on the client
  // For now, it shows an example of pre-populating the form from the server
  
  return (
    <Suspense fallback={<div>Loading duplicate data...</div>}>
      <NewInvoiceForm />
    </Suspense>
  );
}
