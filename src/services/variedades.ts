import type { Variedad } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

const DEMO_LIMIT = 10;

export async function getVariedades(): Promise<Variedad[]> {
  const db = await readDb();
  return db.variedades || [];
}

export async function addVariedad(variedadData: Omit<Variedad, 'id'>): Promise<string> {
  const db = await readDb();
  if (db.variedades.length >= DEMO_LIMIT) {
    throw new Error(`Límite de demostración alcanzado. No se pueden crear más de ${DEMO_LIMIT} productos principales.`);
  }
  const newId = `var-${Date.now()}`;
  const newVariedad: Variedad = { id: newId, ...variedadData };
  db.variedades.push(newVariedad);
  await writeDb(db);
  return newId;
}

export async function updateVariedad(id: string, variedadData: Partial<Omit<Variedad, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.variedades.findIndex(v => v.id === id);
  if (index > -1) {
    db.variedades[index] = { ...db.variedades[index], ...variedadData };
    await writeDb(db);
  } else {
    throw new Error(`Variedad with id ${id} not found.`);
  }
}

export async function deleteVariedad(id: string): Promise<void> {
  const db = await readDb();
  const productsUsingVariety = db.productos.filter(p => p.variedad === db.variedades.find(v => v.id === id)?.nombre);
    if (productsUsingVariety.length > 0) {
        throw new Error(`No se puede eliminar la variedad porque está siendo utilizada por ${productsUsingVariety.length} producto(s).`);
    }
  db.variedades = db.variedades.filter(v => v.id !== id);
  await writeDb(db);
}
