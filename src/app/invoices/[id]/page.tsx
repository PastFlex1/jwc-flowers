import { InvoiceDetailClient } from './invoice-detail-client';

type InvoiceDetailPageProps = {
  params: {
    id: string;
  };
};

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  return <InvoiceDetailClient invoiceId={params.id} />;
}
