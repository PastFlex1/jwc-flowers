import { redirect } from 'next/navigation';

export default function NewPurchasePage() {
  redirect('/invoices/new');
}
