// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { DebitNote } from '@/lib/types';

export function getDebitNotes() {
  return useAppData().debitNotes;
}

export function addDebitNote(data: Omit<DebitNote, 'id'>) {
  return useAppData().addDebitNote(data);
}

export function deleteDebitNote(id: string) {
  return useAppData().deleteDebitNote(id);
}
