import type { Dae } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

export async function getDaes(): Promise<Dae[]> {
  const db = await readDb();
  return db.daes || [];
}

export async function addDae(daeData: Omit<Dae, 'id'>): Promise<string> {
  const db = await readDb();
  const newId = `dae-${Date.now()}`;
  const newDae: Dae = { id: newId, ...daeData };
  db.daes.push(newDae);
  await writeDb(db);
  return newId;
}

export async function updateDae(id: string, daeData: Partial<Omit<Dae, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.daes.findIndex(d => d.id === id);
  if (index > -1) {
    db.daes[index] = { ...db.daes[index], ...daeData };
    await writeDb(db);
  } else {
    throw new Error(`DAE with id ${id} not found.`);
  }
}

export async function deleteDae(id: string): Promise<void> {
  const db = await readDb();
  db.daes = db.daes.filter(d => d.id !== id);
  await writeDb(db);
}
