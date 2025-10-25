// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Provincia } from '@/lib/types';

export function getProvincias() {
  return useAppData().provincias;
}

export function addProvincia(data: Omit<Provincia, 'id'>) {
  return useAppData().addProvincia(data);
}

export function updateProvincia(id: string, data: Partial<Omit<Provincia, 'id'>>) {
  return useAppData().updateProvincia(id, data);
}

export function deleteProvincia(id: string) {
  return useAppData().deleteProvincia(id);
}
