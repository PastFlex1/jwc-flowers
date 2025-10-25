// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Variedad } from '@/lib/types';

export function getVariedades() {
  return useAppData().variedades;
}

export function addVariedad(data: Omit<Variedad, 'id'>) {
  return useAppData().addVariedad(data);
}

export function deleteVariedad(id: string) {
  return useAppData().deleteVariedad(id);
}
