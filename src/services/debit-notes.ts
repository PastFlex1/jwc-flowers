import type { DebitNote } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

const DEMO_LIMIT = 20;

export async function getDebitNotes(): Promise<DebitNote[]> {
  const db = await readDb();
  return db.debitNotes || [];
}

export async function addDebitNote(debitNoteData: Omit<DebitNote, 'id'>): Promise<string> {
  const db = await readDb();
  if (db.debitNotes.length >= DEMO_LIMIT) {
    throw new Error(`Límite de demostración alcanzado. No se pueden crear más de ${DEMO_LIMIT} notas de débito.`);
  }
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
