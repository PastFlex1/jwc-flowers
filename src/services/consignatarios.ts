// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Consignatario } from '@/lib/types';
import { consignatarios as mockConsignatarios } from '@/lib/mock-data';

let consignatarios = [...mockConsignatarios];

export async function getConsignatarios(): Promise<Consignatario[]> {
  return Promise.resolve(consignatarios);
}

export async function getConsignatarioById(id: string): Promise<Consignatario | null> {
    const consignatario = consignatarios.find(c => c.id === id);
    return Promise.resolve(consignatario || null);
}

export async function addConsignatario(consignatarioData: Omit<Consignatario, 'id'>): Promise<string> {
  const newId = `consignatario-${Date.now()}`;
  const newConsignatario: Consignatario = { id: newId, ...consignatarioData };
  consignatarios.push(newConsignatario);
  console.log("Mock addConsignatario:", newConsignatario);
  return Promise.resolve(newId);
}

export async function updateConsignatario(id: string, consignatarioData: Partial<Omit<Consignatario, 'id'>>): Promise<void> {
  consignatarios = consignatarios.map(c => c.id === id ? { ...c, ...consignatarioData } : c);
  console.log("Mock updateConsignatario:", id, consignatarioData);
  return Promise.resolve();
}

export async function deleteConsignatario(id: string): Promise<void> {
  consignatarios = consignatarios.filter(c => c.id !== id);
  console.log("Mock deleteConsignatario:", id);
  return Promise.resolve();
}
