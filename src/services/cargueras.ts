import { db } from '@/lib/firebase';
import type { Carguera } from '@/lib/types';
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

const carguerasCollection = collection(db, 'cargueras');

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): Carguera => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    nombreCarguera: data.nombreCarguera,
    pais: data.pais,
  };
};

export async function getCargueras(): Promise<Carguera[]> {
  const snapshot = await getDocs(carguerasCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function addCarguera(cargueraData: Omit<Carguera, 'id'>): Promise<string> {
  const docRef = await addDoc(carguerasCollection, cargueraData);
  return docRef.id;
}

export async function updateCarguera(id: string, cargueraData: Partial<Omit<Carguera, 'id'>>): Promise<void> {
  const cargueraDoc = doc(db, 'cargueras', id);
  await updateDoc(cargueraDoc, cargueraData);
}

export async function deleteCarguera(id: string): Promise<void> {
  const cargueraDoc = doc(db, 'cargueras', id);
  await deleteDoc(cargueraDoc);
}
