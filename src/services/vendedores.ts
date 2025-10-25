// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Vendedor } from '@/lib/types';

export function getVendedores() {
  return useAppData().vendedores;
}

export function addVendedor(data: Omit<Vendedor, 'id'>) {
  return useAppData().addVendedor(data);
}

export function updateVendedor(id: string, data: Partial<Omit<Vendedor, 'id'>>) {
  return useAppData().updateVendedor(id, data);
}

export function deleteVendedor(id: string) {
  return useAppData().deleteVendedor(id);
}
