// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Carguera } from '@/lib/types';
import { cargueras as mockCargueras } from '@/lib/mock-data';

let cargueras = [...mockCargueras];

export async function getCargueras(): Promise<Carguera[]> {
  return Promise.resolve(cargueras);
}

export async function getCargueraById(id: string): Promise<Carguera | null> {
    const carguera = cargueras.find(c => c.id === id);
    return Promise.resolve(carguera || null);
}

export async function addCarguera(cargueraData: Omit<Carguera, 'id'>): Promise<string> {
  const newId = `carguera-${Date.now()}`;
  const newCarguera: Carguera = { id: newId, ...cargueraData };
  cargueras.push(newCarguera);
  console.log("Mock addCarguera:", newCarguera);
  return Promise.resolve(newId);
}

export async function updateCarguera(id: string, cargueraData: Partial<Omit<Carguera, 'id'>>): Promise<void> {
  cargueras = cargueras.map(c => c.id === id ? { ...c, ...cargueraData } : c);
  console.log("Mock updateCarguera:", id, cargueraData);
  return Promise.resolve();
}

export async function deleteCarguera(id: string): Promise<void> {
  cargueras = cargueras.filter(c => c.id !== id);
  console.log("Mock deleteCarguera:", id);
  return Promise.resolve();
}
