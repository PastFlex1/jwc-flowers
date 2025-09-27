import type { Finca } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

const DEMO_LIMIT = 5;

export async function getFincas(): Promise<Finca[]> {
  const db = await readDb();
  return db.fincas || [];
}

export async function addFinca(fincaData: Omit<Finca, 'id'>): Promise<string> {
  const db = await readDb();
  if (db.fincas.length >= DEMO_LIMIT) {
    throw new Error(`Límite de demostración alcanzado. No se pueden crear más de ${DEMO_LIMIT} fincas.`);
  }
  const newId = `finca-${Date.now()}`;
  const newFinca: Finca = { id: newId, ...fincaData };
  db.fincas.push(newFinca);
  await writeDb(db);
  return newId;
}

export async function updateFinca(id: string, fincaData: Partial<Omit<Finca, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.fincas.findIndex(f => f.id === id);
  if (index > -1) {
    db.fincas[index] = { ...db.fincas[index], ...fincaData };
    await writeDb(db);
  } else {
    throw new Error(`Finca with id ${id} not found.`);
  }
}

export async function deleteFinca(id: string): Promise<void> {
  const db = await readDb();
  db.fincas = db.fincas.filter(f => f.id !== id);
  await writeDb(db);
}
