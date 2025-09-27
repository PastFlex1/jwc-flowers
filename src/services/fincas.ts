// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Finca } from '@/lib/types';
import { fincas as mockFincas } from '@/lib/mock-data';

let fincas = [...mockFincas];

export async function getFincas(): Promise<Finca[]> {
  return Promise.resolve(fincas);
}

export async function addFinca(fincaData: Omit<Finca, 'id'>): Promise<string> {
  const newId = `finca-${Date.now()}`;
  const newFinca: Finca = { id: newId, ...fincaData };
  fincas.push(newFinca);
  console.log("Mock addFinca:", newFinca);
  return Promise.resolve(newId);
}

export async function updateFinca(id: string, fincaData: Partial<Omit<Finca, 'id'>>): Promise<void> {
  fincas = fincas.map(f => f.id === id ? { ...f, ...fincaData } : f);
  console.log("Mock updateFinca:", id, fincaData);
  return Promise.resolve();
}

export async function deleteFinca(id: string): Promise<void> {
  fincas = fincas.filter(f => f.id !== id);
  console.log("Mock deleteFinca:", id);
  return Promise.resolve();
}
