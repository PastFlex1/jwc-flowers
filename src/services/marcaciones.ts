import type { Marcacion } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

const DEMO_LIMIT = 10;

export async function getMarcaciones(): Promise<Marcacion[]> {
  const db = await readDb();
  return db.marcaciones || [];
}

export async function addMarcacion(marcacionData: Omit<Marcacion, 'id'>): Promise<string> {
  const db = await readDb();
  if (db.marcaciones.length >= DEMO_LIMIT) {
    throw new Error(`Límite de demostración alcanzado. No se pueden crear más de ${DEMO_LIMIT} marcaciones.`);
  }
  const newId = `marcacion-${Date.now()}`;
  const newMarcacion: Marcacion = { id: newId, ...marcacionData };
  db.marcaciones.push(newMarcacion);
  await writeDb(db);
  return newId;
}

export async function updateMarcacion(id: string, marcacionData: Partial<Omit<Marcacion, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.marcaciones.findIndex(m => m.id === id);
  if (index > -1) {
    db.marcaciones[index] = { ...db.marcaciones[index], ...marcacionData };
    await writeDb(db);
  } else {
    throw new Error(`Marcacion with id ${id} not found.`);
  }
}

export async function deleteMarcacion(id: string): Promise<void> {
  const db = await readDb();
  db.marcaciones = db.marcaciones.filter(m => m.id !== id);
  await writeDb(db);
}
