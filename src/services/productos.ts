// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Producto } from '@/lib/types';

export function getProductos() {
  return useAppData().productos;
}

export function addProducto(data: Omit<Producto, 'id'>) {
  return useAppData().addProducto(data);
}

export function updateProducto(id: string, data: Partial<Omit<Producto, 'id'>>) {
  return useAppData().updateProducto(id, data);
}

export function deleteProducto(id: string) {
  return useAppData().deleteProducto(id);
}
