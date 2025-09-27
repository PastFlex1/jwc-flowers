// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Dae } from '@/lib/types';
import { daes as mockDaes } from '@/lib/mock-data';

let daes = [...mockDaes];

export async function getDaes(): Promise<Dae[]> {
  return Promise.resolve(daes);
}

export async function addDae(daeData: Omit<Dae, 'id'>): Promise<string> {
  const newId = `dae-${Date.now()}`;
  const newDae: Dae = { id: newId, ...daeData };
  daes.push(newDae);
  console.log("Mock addDae:", newDae);
  return Promise.resolve(newId);
}

export async function updateDae(id: string, daeData: Partial<Omit<Dae, 'id'>>): Promise<void> {
  daes = daes.map(d => d.id === id ? { ...d, ...daeData } : d);
  console.log("Mock updateDae:", id, daeData);
  return Promise.resolve();
}

export async function deleteDae(id: string): Promise<void> {
  daes = daes.filter(d => d.id !== id);
  console.log("Mock deleteDae:", id);
  return Promise.resolve();
}
