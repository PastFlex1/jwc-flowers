



import { db } from '@/lib/firebase';
import type { Invoice, LineItem, Customer, Consignatario, Carguera, Pais } from '@/lib/types';
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
import { getCustomerById } from './customers';
import { getConsignatarioById } from './consignatarios';
import { getCargueraById } from './cargueras';
import { getPaisById } from './paises';

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
    type: data.type || 'sale',
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
    items: Array.isArray(data.items) ? data.items : [],
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

type InvoiceWithDetails = {
    invoice: Invoice;
    customer: Customer | null;
    consignatario: Consignatario | null;
    carguera: Carguera | null;
    pais: Pais | null;
}

export async function getInvoiceWithDetails(id: string): Promise<InvoiceWithDetails | null> {
    const invoice = await getInvoiceById(id);
    if (!invoice) return null;

    const [customer, consignatario, carguera, pais] = await Promise.all([
        getCustomerById(invoice.customerId),
        invoice.consignatarioId ? getConsignatarioById(invoice.consignatarioId) : null,
        invoice.carrierId ? getCargueraById(invoice.carrierId) : null,
        invoice.countryId ? getPaisById(invoice.countryId) : null
    ]);

    return { invoice, customer, consignatario, carguera, pais };
}


export async function addInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<string> {
   if (!db) throw new Error("Firebase is not configured. Check your .env file.");
   const invoicesCollection = collection(db, 'invoices');
   
   const dataToSave = {
    ...invoiceData,
    farmDepartureDate: Timestamp.fromDate(new Date(invoiceData.farmDepartureDate)),
    flightDate: Timestamp.fromDate(new Date(invoiceData.flightDate)),
  };

  const docRef = await addDoc(invoicesCollection, dataToSave);
  return docRef.id;
}

export async function updateInvoice(id: string, invoiceData: Partial<Omit<Invoice, 'id'>>): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const invoiceDoc = doc(db, 'invoices', id);
  const dataToUpdate: any = { ...invoiceData };
  
  if (dataToUpdate.farmDepartureDate && typeof dataToUpdate.farmDepartureDate === 'string') {
    dataToUpdate.farmDepartureDate = Timestamp.fromDate(new Date(dataToUpdate.farmDepartureDate));
  }
  if (dataToUpdate.flightDate && typeof dataToUpdate.flightDate === 'string') {
    dataToUpdate.flightDate = Timestamp.fromDate(new Date(dataToUpdate.flightDate));
  }

  await updateDoc(invoiceDoc, dataToUpdate);
}

export async function deleteInvoice(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const invoiceDoc = doc(db, 'invoices', id);
  await deleteDoc(invoiceDoc);
}

    