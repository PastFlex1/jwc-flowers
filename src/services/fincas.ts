// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Finca } from '@/lib/types';

export function getFincas() {
  return useAppData().fincas;
}

export function addFinca(data: Omit<Finca, 'id'>) {
  return useAppData().addFinca(data);
}

export function updateFinca(id: string, data: Partial<Omit<Finca, 'id'>>) {
  return useAppData().updateFinca(id, data);
}

export function deleteFinca(id: string) {
  return useAppData().deleteFinca(id);
}
