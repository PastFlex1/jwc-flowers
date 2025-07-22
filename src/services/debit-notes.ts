import { db } from '@/lib/firebase';
import type { DebitNote } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): DebitNote => {
  const data = snapshot.data();
  if (!data) throw new Error("Document data not found");
  
  const date = data.date instanceof Timestamp 
    ? data.date.toDate().toISOString() 
    : data.date;

  return {
    id: snapshot.id,
    invoiceId: data.invoiceId,
    invoiceNumber: data.invoiceNumber,
    amount: data.amount,
    reason: data.reason,
    date: date,
  };
};

export async function getDebitNotes(): Promise<DebitNote[]> {
  if (!db) return [];
  const debitNotesCollection = collection(db, 'debitNotes');
  const snapshot = await getDocs(debitNotesCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function getDebitNotesForInvoice(invoiceId: string): Promise<DebitNote[]> {
  if (!db) return [];
  const debitNotesCollection = collection(db, 'debitNotes');
  const q = query(debitNotesCollection, where("invoiceId", "==", invoiceId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(fromFirestore);
}

export async function addDebitNote(debitNoteData: Omit<DebitNote, 'id'>): Promise<string> {
   if (!db) throw new Error("Firebase is not configured. Check your .env file.");
   const debitNotesCollection = collection(db, 'debitNotes');
   const dataWithDate = {
    ...debitNoteData,
    date: new Date(debitNoteData.date),
  };
  const docRef = await addDoc(debitNotesCollection, dataWithDate);
  return docRef.id;
}

export async function deleteDebitNote(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const debitNoteDoc = doc(db, 'debitNotes', id);
  await deleteDoc(debitNoteDoc);
}
