// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { CreditNote } from '@/lib/types';
import { creditNotes as mockCreditNotes } from '@/lib/mock-data';

let creditNotes = [...mockCreditNotes];

export async function getCreditNotes(): Promise<CreditNote[]> {
  return Promise.resolve(creditNotes);
}

export async function getCreditNotesForInvoice(invoiceId: string): Promise<CreditNote[]> {
  const notes = creditNotes.filter(note => note.invoiceId === invoiceId);
  return Promise.resolve(notes);
}

export async function addCreditNote(creditNoteData: Omit<CreditNote, 'id'>): Promise<string> {
  const newId = `cn-${Date.now()}`;
  const newNote: CreditNote = { id: newId, ...creditNoteData };
  creditNotes.push(newNote);
  console.log("Mock addCreditNote:", newNote);
  return Promise.resolve(newId);
}

export async function deleteCreditNote(id: string): Promise<void> {
  creditNotes = creditNotes.filter(note => note.id !== id);
  console.log("Mock deleteCreditNote:", id);
  return Promise.resolve();
}
