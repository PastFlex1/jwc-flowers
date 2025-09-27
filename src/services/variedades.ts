// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Variedad } from '@/lib/types';
import { variedades as mockVariedades } from '@/lib/mock-data';

let variedades = [...mockVariedades];

export async function getVariedades(): Promise<Variedad[]> {
  return Promise.resolve(variedades);
}

export async function addVariedad(variedadData: Omit<Variedad, 'id'>): Promise<string> {
  const newId = `var-${Date.now()}`;
  const newVariedad: Variedad = { id: newId, ...variedadData };
  variedades.push(newVariedad);
  console.log("Mock addVariedad:", newVariedad);
  return Promise.resolve(newId);
}

export async function updateVariedad(id: string, variedadData: Partial<Omit<Variedad, 'id'>>): Promise<void> {
  variedades = variedades.map(v => v.id === id ? { ...v, ...variedadData } : v);
  console.log("Mock updateVariedad:", id, variedadData);
  return Promise.resolve();
}

export async function deleteVariedad(id: string): Promise<void> {
  variedades = variedades.filter(v => v.id !== id);
  console.log("Mock deleteVariedad:", id);
  return Promise.resolve();
}
