import { db } from '@/lib/firebase';
import type { Consignatario } from '@/lib/types';
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

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): Consignatario => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    nombreConsignatario: data.nombreConsignatario,
    pais: data.pais,
    customerId: data.customerId,
  };
};

export async function getConsignatarios(): Promise<Consignatario[]> {
  if (!db) return [];
  const consignatariosCollection = collection(db, 'consignatarios');
  const snapshot = await getDocs(consignatariosCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function addConsignatario(consignatarioData: Omit<Consignatario, 'id'>): Promise<string> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const consignatariosCollection = collection(db, 'consignatarios');
  const docRef = await addDoc(consignatariosCollection, consignatarioData);
  return docRef.id;
}

export async function updateConsignatario(id: string, consignatarioData: Partial<Omit<Consignatario, 'id'>>): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const consignatarioDoc = doc(db, 'consignatarios', id);
  await updateDoc(consignatarioDoc, consignatarioData);
}

export async function deleteConsignatario(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const consignatarioDoc = doc(db, 'consignatarios', id);
  await deleteDoc(consignatarioDoc);
}
