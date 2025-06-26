import { db } from '@/lib/firebase';
import type { Provincia } from '@/lib/types';
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

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): Provincia => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    nombre: data.nombre,
  };
};

export async function getProvincias(): Promise<Provincia[]> {
  if (!db) return [];
  const provinciasCollection = collection(db, 'provincias');
  const snapshot = await getDocs(provinciasCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function addProvincia(provinciaData: Omit<Provincia, 'id'>): Promise<string> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const provinciasCollection = collection(db, 'provincias');
  const docRef = await addDoc(provinciasCollection, provinciaData);
  return docRef.id;
}

export async function updateProvincia(id: string, provinciaData: Partial<Omit<Provincia, 'id'>>): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const provinciaDoc = doc(db, 'provincias', id);
  await updateDoc(provinciaDoc, provinciaData);
}

export async function deleteProvincia(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const provinciaDoc = doc(db, 'provincias', id);
  await deleteDoc(provinciaDoc);
}
