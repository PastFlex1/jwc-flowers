import type { Pais } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

export async function getPaises(): Promise<Pais[]> {
  const db = await readDb();
  return db.paises || [];
}

export async function addPais(paisData: Omit<Pais, 'id'>): Promise<string> {
  const db = await readDb();
  const newId = `pais-${Date.now()}`;
  const newPais: Pais = { id: newId, ...paisData };
  db.paises.push(newPais);
  await writeDb(db);
  return newId;
}

export async function updatePais(id: string, paisData: Partial<Omit<Pais, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.paises.findIndex(p => p.id === id);
  if (index > -1) {
    db.paises[index] = { ...db.paises[index], ...paisData };
    await writeDb(db);
  } else {
    throw new Error(`Pais with id ${id} not found.`);
  }
}

export async function deletePais(id: string): Promise<void> {
  const db = await readDb();
  db.paises = db.paises.filter(p => p.id !== id);
  await writeDb(db);
}
