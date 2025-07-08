import { db } from '@/lib/firebase';
import type { Carguera } from '@/lib/types';
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

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Carguera => {
  const data = snapshot.data();
  if (!data) throw new Error("Document data not found");
  return {
    id: snapshot.id,
    nombreCarguera: data.nombreCarguera,
    pais: data.pais,
  };
};

export async function getCargueras(): Promise<Carguera[]> {
  if (!db) return [];
  const carguerasCollection = collection(db, 'cargueras');
  const snapshot = await getDocs(carguerasCollection);
  return snapshot.docs.map(doc => fromFirestore(doc));
}

export async function getCargueraById(id: string): Promise<Carguera | null> {
    if (!db) return null;
    const cargueraDoc = doc(db, 'cargueras', id);
    const snapshot = await getDoc(cargueraDoc);
    if (snapshot.exists()) {
        return fromFirestore(snapshot);
    }
    return null;
}

export async function addCarguera(cargueraData: Omit<Carguera, 'id'>): Promise<string> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const carguerasCollection = collection(db, 'cargueras');
  const docRef = await addDoc(carguerasCollection, cargueraData);
  return docRef.id;
}

export async function updateCarguera(id: string, cargueraData: Partial<Omit<Carguera, 'id'>>): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const cargueraDoc = doc(db, 'cargueras', id);
  await updateDoc(cargueraDoc, cargueraData);
}

export async function deleteCarguera(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const cargueraDoc = doc(db, 'cargueras', id);
  await deleteDoc(cargueraDoc);
}
