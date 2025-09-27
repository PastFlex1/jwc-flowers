import type { Vendedor } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

export async function getVendedores(): Promise<Vendedor[]> {
  const db = await readDb();
  return db.vendedores || [];
}

export async function addVendedor(vendedorData: Omit<Vendedor, 'id'>): Promise<string> {
  const db = await readDb();
  const newId = `vend-${Date.now()}`;
  const newVendedor: Vendedor = { id: newId, ...vendedorData };
  db.vendedores.push(newVendedor);
  await writeDb(db);
  return newId;
}

export async function updateVendedor(id: string, vendedorData: Partial<Omit<Vendedor, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.vendedores.findIndex(v => v.id === id);
  if (index > -1) {
    db.vendedores[index] = { ...db.vendedores[index], ...vendedorData };
    await writeDb(db);
  } else {
    throw new Error(`Vendedor with id ${id} not found.`);
  }
}

export async function deleteVendedor(id: string): Promise<void> {
  const db = await readDb();
  db.vendedores = db.vendedores.filter(v => v.id !== id);
  await writeDb(db);
}
