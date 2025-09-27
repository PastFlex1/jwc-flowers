import type { Consignatario } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

export async function getConsignatarios(): Promise<Consignatario[]> {
  const db = await readDb();
  return db.consignatarios || [];
}

export async function addConsignatario(consignatarioData: Omit<Consignatario, 'id'>): Promise<string> {
  const db = await readDb();
  const newId = `consignatario-${Date.now()}`;
  const newConsignatario: Consignatario = { id: newId, ...consignatarioData };
  db.consignatarios.push(newConsignatario);
  await writeDb(db);
  return newId;
}

export async function updateConsignatario(id: string, consignatarioData: Partial<Omit<Consignatario, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.consignatarios.findIndex(c => c.id === id);
  if (index > -1) {
    db.consignatarios[index] = { ...db.consignatarios[index], ...consignatarioData };
    await writeDb(db);
  } else {
    throw new Error(`Consignatario with id ${id} not found.`);
  }
}

export async function deleteConsignatario(id: string): Promise<void> {
  const db = await readDb();
  db.consignatarios = db.consignatarios.filter(c => c.id !== id);
  await writeDb(db);
}
