import type { Producto } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

const DEMO_LIMIT = 20;

export async function getProductos(): Promise<Producto[]> {
  const db = await readDb();
  return db.productos || [];
}

export async function addProducto(productoData: Omit<Producto, 'id'>): Promise<string> {
  const db = await readDb();
  if (db.productos.length >= DEMO_LIMIT) {
    throw new Error(`Límite de demostración alcanzado. No se pueden crear más de ${DEMO_LIMIT} productos/variedades.`);
  }
  const newId = `prod-${Date.now()}`;
  const newProducto: Producto = { id: newId, ...productoData };
  db.productos.push(newProducto);
  await writeDb(db);
  return newId;
}

export async function updateProducto(id: string, productoData: Partial<Omit<Producto, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.productos.findIndex(p => p.id === id);
  if (index > -1) {
    db.productos[index] = { ...db.productos[index], ...productoData } as Producto;
    await writeDb(db);
  } else {
    throw new Error(`Producto with id ${id} not found.`);
  }
}

export async function deleteProducto(id: string): Promise<void> {
  const db = await readDb();
  db.productos = db.productos.filter(p => p.id !== id);
  await writeDb(db);
}
