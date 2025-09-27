import type { Provincia } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

const DEMO_LIMIT = 10;

export async function getProvincias(): Promise<Provincia[]> {
  const db = await readDb();
  return db.provincias || [];
}

export async function addProvincia(provinciaData: Omit<Provincia, 'id'>): Promise<string> {
  const db = await readDb();
  if (db.provincias.length >= DEMO_LIMIT) {
    throw new Error(`Límite de demostración alcanzado. No se pueden crear más de ${DEMO_LIMIT} provincias.`);
  }
  const newId = `prov-${Date.now()}`;
  const newProvincia: Provincia = { id: newId, ...provinciaData };
  db.provincias.push(newProvincia);
  await writeDb(db);
  return newId;
}

export async function updateProvincia(id: string, provinciaData: Partial<Omit<Provincia, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.provincias.findIndex(p => p.id === id);
  if (index > -1) {
    db.provincias[index] = { ...db.provincias[index], ...provinciaData };
    await writeDb(db);
  } else {
    throw new Error(`Provincia with id ${id} not found.`);
  }
}

export async function deleteProvincia(id: string): Promise<void> {
  const db = await readDb();
  db.provincias = db.provincias.filter(p => p.id !== id);
  await writeDb(db);
}
