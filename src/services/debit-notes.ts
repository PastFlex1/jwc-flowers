import type { DebitNote } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';
import { updateInvoice } from './invoices';

export async function getDebitNotes(): Promise<DebitNote[]> {
  const db = await readDb();
  return db.debitNotes || [];
}

export async function addDebitNote(debitNoteData: Omit<DebitNote, 'id'>): Promise<string> {
  const db = await readDb();
  const newId = `dn-${Date.now()}`;
  const newNote: DebitNote = { id: newId, ...debitNoteData };
  db.debitNotes.push(newNote);
  
  const invoice = db.invoices.find(inv => inv.id === debitNoteData.invoiceId);
  if (invoice && invoice.status === 'Paid') {
    invoice.status = 'Pending';
  }
  
  await writeDb(db);
  return newId;
}

export async function deleteDebitNote(id: string): Promise<void> {
  const db = await readDb();
  db.debitNotes = db.debitNotes.filter(note => note.id !== id);
  await writeDb(db);
}
