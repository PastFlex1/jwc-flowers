import type { CreditNote } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

export async function getCreditNotes(): Promise<CreditNote[]> {
  const db = await readDb();
  return db.creditNotes || [];
}

export async function addCreditNote(creditNoteData: Omit<CreditNote, 'id'>): Promise<string> {
  const db = await readDb();
  const newId = `cn-${Date.now()}`;
  const newNote: CreditNote = { id: newId, ...creditNoteData };
  db.creditNotes.push(newNote);
  await writeDb(db);
  return newId;
}

export async function deleteCreditNote(id: string): Promise<void> {
  const db = await readDb();
  db.creditNotes = db.creditNotes.filter(note => note.id !== id);
  await writeDb(db);
}
