// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Marcacion } from '@/lib/types';
import { marcaciones as mockMarcaciones } from '@/lib/mock-data';

let marcaciones = [...mockMarcaciones];

export async function getMarcaciones(): Promise<Marcacion[]> {
  return Promise.resolve(marcaciones);
}

export async function addMarcacion(marcacionData: Omit<Marcacion, 'id'>): Promise<string> {
  const newId = `marcacion-${Date.now()}`;
  const newMarcacion: Marcacion = { id: newId, ...marcacionData };
  marcaciones.push(newMarcacion);
  console.log("Mock addMarcacion:", newMarcacion);
  return Promise.resolve(newId);
}

export async function updateMarcacion(id: string, marcacionData: Partial<Omit<Marcacion, 'id'>>): Promise<void> {
  marcaciones = marcaciones.map(m => m.id === id ? { ...m, ...marcacionData } : m);
  console.log("Mock updateMarcacion:", id, marcacionData);
  return Promise.resolve();
}

export async function deleteMarcacion(id: string): Promise<void> {
  marcaciones = marcaciones.filter(m => m.id !== id);
  console.log("Mock deleteMarcacion:", id);
  return Promise.resolve();
}
