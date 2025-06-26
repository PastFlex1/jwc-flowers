import { db } from '@/lib/firebase';
import type { InventoryItem } from '@/lib/types';
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

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): InventoryItem => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name,
    description: data.description,
    price: data.price,
    cost: data.cost,
  };
};

export async function getInventoryItems(): Promise<InventoryItem[]> {
  if (!db) return [];
  const inventoryCollection = collection(db, 'inventory');
  const snapshot = await getDocs(inventoryCollection);
  return snapshot.docs.map(fromFirestore);
}

export async function addInventoryItem(itemData: Omit<InventoryItem, 'id'>): Promise<string> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const inventoryCollection = collection(db, 'inventory');
  const docRef = await addDoc(inventoryCollection, itemData);
  return docRef.id;
}

export async function updateInventoryItem(id: string, itemData: Partial<Omit<InventoryItem, 'id'>>): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const itemDoc = doc(db, 'inventory', id);
  await updateDoc(itemDoc, itemData);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");
  const itemDoc = doc(db, 'inventory', id);
  await deleteDoc(itemDoc);
}
