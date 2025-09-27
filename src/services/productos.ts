// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Producto } from '@/lib/types';
import { productos as mockProductos } from '@/lib/mock-data';

let productos = [...mockProductos];

export async function getProductos(): Promise<Producto[]> {
  return Promise.resolve(productos);
}

export async function addProducto(productoData: Omit<Producto, 'id'>): Promise<string> {
  const newId = `prod-${Date.now()}`;
  const newProducto: Producto = { id: newId, ...productoData };
  productos.push(newProducto);
  console.log("Mock addProducto:", newProducto);
  return Promise.resolve(newId);
}

export async function updateProducto(id: string, productoData: Partial<Omit<Producto, 'id'>>): Promise<void> {
  productos = productos.map(p => p.id === id ? { ...p, ...productoData } as Producto : p);
  console.log("Mock updateProducto:", id, productoData);
  return Promise.resolve();
}

export async function deleteProducto(id: string): Promise<void> {
  productos = productos.filter(p => p.id !== id);
  console.log("Mock deleteProducto:", id);
  return Promise.resolve();
}
