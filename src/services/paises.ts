// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Pais } from '@/lib/types';
import { paises as mockPaises } from '@/lib/mock-data';

let paises = [...mockPaises];

export async function getPaises(): Promise<Pais[]> {
  return Promise.resolve(paises);
}

export async function getPaisById(id: string): Promise<Pais | null> {
    const pais = paises.find(p => p.id === id);
    return Promise.resolve(pais || null);
}

export async function addPais(paisData: Omit<Pais, 'id'>): Promise<string> {
  const newId = `pais-${Date.now()}`;
  const newPais: Pais = { id: newId, ...paisData };
  paises.push(newPais);
  console.log("Mock addPais:", newPais);
  return Promise.resolve(newId);
}

export async function updatePais(id: string, paisData: Partial<Omit<Pais, 'id'>>): Promise<void> {
  paises = paises.map(p => p.id === id ? { ...p, ...paisData } : p);
  console.log("Mock updatePais:", id, paisData);
  return Promise.resolve();
}

export async function deletePais(id: string): Promise<void> {
  paises = paises.filter(p => p.id !== id);
  console.log("Mock deletePais:", id);
  return Promise.resolve();
}
