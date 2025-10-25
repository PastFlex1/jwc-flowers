// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Consignatario } from '@/lib/types';

export function getConsignatarios() {
  return useAppData().consignatarios;
}

export function addConsignatario(data: Omit<Consignatario, 'id'>) {
  return useAppData().addConsignatario(data);
}

export function updateConsignatario(id: string, data: Partial<Omit<Consignatario, 'id'>>) {
  return useAppData().updateConsignatario(id, data);
}

export function deleteConsignatario(id: string) {
  return useAppData().deleteConsignatario(id);
}
