import { Suspense } from 'react';
import { NewInvoiceForm } from './new-invoice-form';

function NewInvoicePageContent() {
  return <NewInvoiceForm />;
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewInvoicePageContent />
    </Suspense>
  );
}
