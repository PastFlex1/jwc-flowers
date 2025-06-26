import { db } from '@/lib/firebase';
import type { Invoice, LineItem } from '@/lib/types';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';

const invoicesCollection = collection(db, 'invoices');

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Invoice => {
  const data = snapshot.data();
  if (!data) throw new Error("Document data not found");
  
  // Handle Firestore Timestamps by converting them to ISO strings
  const farmDepartureDate = data.farmDepartureDate?.toDate ? data.farmDepartureDate.toDate().toISOString() : data.farmDepartureDate;
  const flightDate = data.flightDate?.toDate ? data.flightDate.toDate().toISOString() : data.flightDate;

  return {
    id: snapshot.id,
    invoiceNumber: data.invoiceNumber,
    customerId: data.customerId,
    farmDepartureDate: farmDepartureDate,
    flightDate: flightDate,
    sellerId: data.sellerId,
    farmId: data.farmId,
    carrierId: data.carrierId,
    countryId: data.countryId,
    pointOfSale: data.pointOfSale,
    reference: data.reference,
    masterAWB: data.masterAWB,
    houseAWB: data.houseAWB,
    items: data.items as LineItem[],
    status: data.status || 'Pending',
  };
};

export async function getInvoices(): Promise<Invoice[]> {
  const snapshot = await getDocs(invoicesCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const invoiceDoc = doc(db, 'invoices', id);
  const snapshot = await getDoc(invoiceDoc);
  if (snapshot.exists()) {
    return fromFirestore(snapshot);
  }
  return null;
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id' | 'status'>): Promise<string> {
   const dataWithStatus = {
    ...invoiceData,
    status: 'Pending' as const,
  };
  const docRef = await addDoc(invoicesCollection, dataWithStatus);
  return docRef.id;
}

export async function updateInvoice(id: string, invoiceData: Partial<Omit<Invoice, 'id'>>): Promise<void> {
  const invoiceDoc = doc(db, 'invoices', id);
  await updateDoc(invoiceDoc, invoiceData);
}

export async function deleteInvoice(id: string): Promise<void> {
  const invoiceDoc = doc(db, 'invoices', id);
  await deleteDoc(invoiceDoc);
}
