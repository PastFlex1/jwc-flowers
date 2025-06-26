import { db } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

const customersCollection = collection(db, 'customers');

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): Customer => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name,
    pais: data.pais,
    estadoCiudad: data.estadoCiudad,
    address: data.address,
    email: data.email,
    phone: data.phone,
    agencia: data.agencia,
    vendedor: data.vendedor,
    plazo: data.plazo,
    cupo: data.cupo,
  };
};

export async function getCustomers(): Promise<Customer[]> {
  const snapshot = await getDocs(customersCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<string> {
  const docRef = await addDoc(customersCollection, customerData);
  return docRef.id;
}

export async function updateCustomer(id: string, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> {
  const customerDoc = doc(db, 'customers', id);
  await updateDoc(customerDoc, customerData);
}

export async function deleteCustomer(id: string): Promise<void> {
  const customerDoc = doc(db, 'customers', id);
  await deleteDoc(customerDoc);
}
