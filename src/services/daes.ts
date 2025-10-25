// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Dae } from '@/lib/types';

export function getDaes() {
  return useAppData().daes;
}

export function addDae(data: Omit<Dae, 'id'>) {
  return useAppData().addDae(data);
}

export function updateDae(id: string, data: Partial<Omit<Dae, 'id'>>) {
  return useAppData().updateDae(id, data);
}

export function deleteDae(id: string) {
  return useAppData().deleteDae(id);
}
