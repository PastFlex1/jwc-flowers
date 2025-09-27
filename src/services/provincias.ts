// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Provincia } from '@/lib/types';
import { provincias as mockProvincias } from '@/lib/mock-data';

let provincias = [...mockProvincias];

export async function getProvincias(): Promise<Provincia[]> {
  return Promise.resolve(provincias);
}

export async function addProvincia(provinciaData: Omit<Provincia, 'id'>): Promise<string> {
  const newId = `prov-${Date.now()}`;
  const newProvincia: Provincia = { id: newId, ...provinciaData };
  provincias.push(newProvincia);
  console.log("Mock addProvincia:", newProvincia);
  return Promise.resolve(newId);
}

export async function updateProvincia(id: string, provinciaData: Partial<Omit<Provincia, 'id'>>): Promise<void> {
  provincias = provincias.map(p => p.id === id ? { ...p, ...provinciaData } : p);
  console.log("Mock updateProvincia:", id, provinciaData);
  return Promise.resolve();
}

export async function deleteProvincia(id: string): Promise<void> {
  provincias = provincias.filter(p => p.id !== id);
  console.log("Mock deleteProvincia:", id);
  return Promise.resolve();
}
