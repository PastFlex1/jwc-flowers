import { db } from '@/lib/firebase';
import type { Dae } from '@/lib/types';
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

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): Dae => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    pais: data.pais,
    numeroDae: data.numeroDae,
  };
};

export async function getDaes(): Promise<Dae[]> {
  if (!db) return [];
  const daesCollection = collection(db, 'daes');
  const snapshot = await getDocs(daesCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function addDae(daeData: Omit<Dae, 'id'>): Promise<string> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const daesCollection = collection(db, 'daes');
  const docRef = await addDoc(daesCollection, daeData);
  return docRef.id;
}

export async function updateDae(id: string, daeData: Partial<Omit<Dae, 'id'>>): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const daeDoc = doc(db, 'daes', id);
  await updateDoc(daeDoc, daeData);
}

export async function deleteDae(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const daeDoc = doc(db, 'daes', id);
  await deleteDoc(daeDoc);
}
