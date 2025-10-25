// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Carguera } from '@/lib/types';

export function getCargueras() {
  return useAppData().cargueras;
}

export function addCarguera(cargueraData: Omit<Carguera, 'id'>) {
  return useAppData().addCarguera(cargueraData);
}

export function updateCarguera(id: string, cargueraData: Partial<Omit<Carguera, 'id'>>) {
  return useAppData().updateCarguera(id, cargueraData);
}

export function deleteCarguera(id: string) {
  return useAppData().deleteCarguera(id);
}
