// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Invoice } from '@/lib/types';

export function getInvoices() {
  return useAppData().invoices;
}

export function addInvoice(data: Omit<Invoice, 'id'>) {
  return useAppData().addInvoice(data);
}

export function updateInvoice(id: string, data: Partial<Omit<Invoice, 'id'>>) {
  return useAppData().updateInvoice(id, data);
}

export function deleteInvoice(id: string) {
  return useAppData().deleteInvoice(id);
}
