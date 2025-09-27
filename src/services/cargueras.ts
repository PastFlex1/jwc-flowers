import type { Carguera } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

const DEMO_LIMIT = 10;

export async function getCargueras(): Promise<Carguera[]> {
  const db = await readDb();
  return db.cargueras || [];
}

export async function addCarguera(cargueraData: Omit<Carguera, 'id'>): Promise<string> {
  const db = await readDb();
  if (db.cargueras.length >= DEMO_LIMIT) {
    throw new Error(`Límite de demostración alcanzado. No se pueden crear más de ${DEMO_LIMIT} cargueras.`);
  }
  const newId = `carguera-${Date.now()}`;
  const newCarguera: Carguera = { id: newId, ...cargueraData };
  db.cargueras.push(newCarguera);
  await writeDb(db);
  return newId;
}

export async function updateCarguera(id: string, cargueraData: Partial<Omit<Carguera, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.cargueras.findIndex(c => c.id === id);
  if (index > -1) {
    db.cargueras[index] = { ...db.cargueras[index], ...cargueraData };
    await writeDb(db);
  } else {
    throw new Error(`Carguera with id ${id} not found.`);
  }
}

export async function deleteCarguera(id: string): Promise<void> {
  const db = await readDb();
  db.cargueras = db.cargueras.filter(c => c.id !== id);
  await writeDb(db);
}
