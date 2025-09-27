// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { DebitNote } from '@/lib/types';
import { debitNotes as mockDebitNotes } from '@/lib/mock-data';
import { getInvoices, updateInvoice } from './invoices';

let debitNotes = [...mockDebitNotes];

export async function getDebitNotes(): Promise<DebitNote[]> {
  return Promise.resolve(debitNotes);
}

export async function getDebitNotesForInvoice(invoiceId: string): Promise<DebitNote[]> {
  const notes = debitNotes.filter(note => note.invoiceId === invoiceId);
  return Promise.resolve(notes);
}

export async function addDebitNote(debitNoteData: Omit<DebitNote, 'id'>): Promise<string> {
  const newId = `dn-${Date.now()}`;
  const newNote: DebitNote = { id: newId, ...debitNoteData };
  debitNotes.push(newNote);
  console.log("Mock addDebitNote:", newNote);
  
  // Simulate transaction: update invoice status if it was paid
  const invoices = await getInvoices();
  const invoice = invoices.find(inv => inv.id === debitNoteData.invoiceId);
  if (invoice && invoice.status === 'Paid') {
    await updateInvoice(invoice.id, { status: 'Pending' });
    console.log(`Mock: Invoice ${invoice.invoiceNumber} status updated to Pending due to new debit note.`);
  }

  return Promise.resolve(newId);
}

export async function deleteDebitNote(id: string): Promise<void> {
  debitNotes = debitNotes.filter(note => note.id !== id);
  console.log("Mock deleteDebitNote:", id);
  return Promise.resolve();
}
