import { db } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Customer => {
  const data = snapshot.data();
   if (!data) throw new Error("Document data not found");
  return {
    id: snapshot.id,
    name: data.name,
    cedula: data.cedula,
    pais: data.pais,
    estadoCiudad: data.estadoCiudad,
    address: data.address,
    email: data.email,
    phone: data.phone,
    agencia: data.agencia,
    vendedor: data.vendedor,
    plazo: data.plazo,
    cupo: data.cupo,
    daeId: data.daeId,
  };
};

export async function getCustomers(): Promise<Customer[]> {
  if (!db) return [];
  const customersCollection = collection(db, 'customers');
  const snapshot = await getDocs(customersCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  if (!db) return null;
  const customerDoc = doc(db, 'customers', id);
  const snapshot = await getDoc(customerDoc);
  if (snapshot.exists()) {
    return fromFirestore(snapshot);
  }
  return null;
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<string> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const customersCollection = collection(db, 'customers');
  const docRef = await addDoc(customersCollection, customerData);
  return docRef.id;
}

export async function updateCustomer(id: string, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const customerDoc = doc(db, 'customers', id);
  await updateDoc(customerDoc, customerData);
}

export async function deleteCustomer(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const customerDoc = doc(db, 'customers', id);
  await deleteDoc(customerDoc);
}
