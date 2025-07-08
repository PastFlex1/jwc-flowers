import { db } from '@/lib/firebase';
import type { Pais } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Pais => {
  const data = snapshot.data();
  if (!data) throw new Error("Document data not found");
  return {
    id: snapshot.id,
    nombre: data.nombre,
  };
};

export async function getPaises(): Promise<Pais[]> {
  if (!db) return [];
  const paisesCollection = collection(db, 'paises');
  const snapshot = await getDocs(paisesCollection);
  return snapshot.docs.map(d => fromFirestore(d));
}

export async function getPaisById(id: string): Promise<Pais | null> {
    if (!db) return null;
    const paisDoc = doc(db, 'paises', id);
    const snapshot = await getDoc(paisDoc);
    if (snapshot.exists()) {
        return fromFirestore(snapshot);
    }
    return null;
}

export async function addPais(paisData: Omit<Pais, 'id'>): Promise<string> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const paisesCollection = collection(db, 'paises');
  const docRef = await addDoc(paisesCollection, paisData);
  return docRef.id;
}

export async function updatePais(id: string, paisData: Partial<Omit<Pais, 'id'>>): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const paisDoc = doc(db, 'paises', id);
  await updateDoc(paisDoc, paisData);
}

export async function deletePais(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const paisDoc = doc(db, 'paises', id);
  await deleteDoc(paisDoc);
}
