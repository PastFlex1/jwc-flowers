// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Pais } from '@/lib/types';

export function getPaises() {
  return useAppData().paises;
}

export function addPais(data: Omit<Pais, 'id'>) {
  return useAppData().addPais(data);
}

export function updatePais(id: string, data: Partial<Omit<Pais, 'id'>>) {
  return useAppData().updatePais(id, data);
}

export function deletePais(id: string) {
  return useAppData().deletePais(id);
}
