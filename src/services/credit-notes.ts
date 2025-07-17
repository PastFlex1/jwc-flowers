import { db } from '@/lib/firebase';
import type { CreditNote } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): CreditNote => {
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

export async function getCreditNotes(): Promise<CreditNote[]> {
  if (!db) return [];
  const creditNotesCollection = collection(db, 'creditNotes');
  const snapshot = await getDocs(creditNotesCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function getCreditNotesForInvoice(invoiceId: string): Promise<CreditNote[]> {
  if (!db) return [];
  const creditNotesCollection = collection(db, 'creditNotes');
  const q = query(creditNotesCollection, where("invoiceId", "==", invoiceId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(fromFirestore);
}

export async function addCreditNote(creditNoteData: Omit<CreditNote, 'id'>): Promise<string> {
   if (!db) throw new Error("Firebase is not configured. Check your .env file.");
   const creditNotesCollection = collection(db, 'creditNotes');
   const dataWithDate = {
    ...creditNoteData,
    date: new Date(creditNoteData.date),
  };
  const docRef = await addDoc(creditNotesCollection, dataWithDate);
  return docRef.id;
}

export async function deleteCreditNote(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const creditNoteDoc = doc(db, 'creditNotes', id);
  await deleteDoc(creditNoteDoc);
}
