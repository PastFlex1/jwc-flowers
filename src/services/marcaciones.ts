// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Marcacion } from '@/lib/types';

export function getMarcaciones() {
  return useAppData().marcaciones;
}

export function addMarcacion(data: Omit<Marcacion, 'id'>) {
  return useAppData().addMarcacion(data);
}

export function updateMarcacion(id: string, data: Partial<Omit<Marcacion, 'id'>>) {
  return useAppData().updateMarcacion(id, data);
}

export function deleteMarcacion(id: string) {
  return useAppData().deleteMarcacion(id);
}
