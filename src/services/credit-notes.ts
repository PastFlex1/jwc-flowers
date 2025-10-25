// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { CreditNote } from '@/lib/types';

export function getCreditNotes() {
  return useAppData().creditNotes;
}

export function addCreditNote(data: Omit<CreditNote, 'id'>) {
  return useAppData().addCreditNote(data);
}

export function deleteCreditNote(id: string) {
  return useAppData().deleteCreditNote(id);
}
