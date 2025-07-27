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
  Timestamp,
} from 'firebase/firestore';

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Invoice => {
  const data = snapshot.data();
  if (!data) throw new Error("Document data not found");
  
  const farmDepartureDate = data.farmDepartureDate instanceof Timestamp 
    ? data.farmDepartureDate.toDate().toISOString() 
    : data.farmDepartureDate;
    
  const flightDate = data.flightDate instanceof Timestamp 
    ? data.flightDate.toDate().toISOString() 
    : data.flightDate;

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
    reference: data.reference,
    masterAWB: data.masterAWB,
    houseAWB: data.houseAWB,
    items: Array.isArray(data.items) ? data.items.map((item: any) => ({
      ...item,
      product: item.product || '', 
      variety: item.variety || '',
    })) : [],
    status: data.status || 'Pending',
    consignatarioId: data.consignatarioId,
  };
};

export async function getInvoices(): Promise<Invoice[]> {
  if (!db) return [];
  const invoicesCollection = collection(db, 'invoices');
  const snapshot = await getDocs(invoicesCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (!db) return null;
  const invoiceDoc = doc(db, 'invoices', id);
  const snapshot = await getDoc(invoiceDoc);
  if (snapshot.exists()) {
    return fromFirestore(snapshot);
  }
  return null;
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id' | 'status'>): Promise<string> {
   if (!db) throw new Error("Firebase is not configured. Check your .env file.");
   const invoicesCollection = collection(db, 'invoices');
   
   const dataToSave = {
    ...invoiceData,
    farmDepartureDate: Timestamp.fromDate(new Date(invoiceData.farmDepartureDate)),
    flightDate: Timestamp.fromDate(new Date(invoiceData.flightDate)),
    status: 'Pending' as const,
  };

  const docRef = await addDoc(invoicesCollection, dataToSave);
  return docRef.id;
}

export async function updateInvoice(id: string, invoiceData: Partial<Omit<Invoice, 'id'>>): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const invoiceDoc = doc(db, 'invoices', id);
  const dataToUpdate = { ...invoiceData };
  if (dataToUpdate.farmDepartureDate) {
    dataToUpdate.farmDepartureDate = Timestamp.fromDate(new Date(dataToUpdate.farmDepartureDate)) as any;
  }
  if (dataToUpdate.flightDate) {
    dataToUpdate.flightDate = Timestamp.fromDate(new Date(dataToUpdate.flightDate)) as any;
  }
  await updateDoc(invoiceDoc, dataToUpdate);
}

export async function deleteInvoice(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const invoiceDoc = doc(db, 'invoices', id);
  await deleteDoc(invoiceDoc);
}

    