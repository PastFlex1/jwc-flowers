import { db } from '@/lib/firebase';
import type { Pais } from '@/lib/types';
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

const paisesCollection = collection(db, 'paises');

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): Pais => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    nombre: data.nombre,
  };
};

export async function getPaises(): Promise<Pais[]> {
  const snapshot = await getDocs(paisesCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function addPais(paisData: Omit<Pais, 'id'>): Promise<string> {
  const docRef = await addDoc(paisesCollection, paisData);
  return docRef.id;
}

export async function updatePais(id: string, paisData: Partial<Omit<Pais, 'id'>>): Promise<void> {
  const paisDoc = doc(db, 'paises', id);
  await updateDoc(paisDoc, paisData);
}

export async function deletePais(id: string): Promise<void> {
  const paisDoc = doc(db, 'paises', id);
  await deleteDoc(paisDoc);
}
