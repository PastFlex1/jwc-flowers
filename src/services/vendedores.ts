// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Vendedor } from '@/lib/types';
import { vendedores as mockVendedores } from '@/lib/mock-data';

let vendedores = [...mockVendedores];

export async function getVendedores(): Promise<Vendedor[]> {
  return Promise.resolve(vendedores);
}

export async function addVendedor(vendedorData: Omit<Vendedor, 'id'>): Promise<string> {
  const newId = `vend-${Date.now()}`;
  const newVendedor: Vendedor = { id: newId, ...vendedorData };
  vendedores.push(newVendedor);
  console.log("Mock addVendedor:", newVendedor);
  return Promise.resolve(newId);
}

export async function updateVendedor(id: string, vendedorData: Partial<Omit<Vendedor, 'id'>>): Promise<void> {
  vendedores = vendedores.map(v => v.id === id ? { ...v, ...vendedorData } : v);
  console.log("Mock updateVendedor:", id, vendedorData);
  return Promise.resolve();
}

export async function deleteVendedor(id: string): Promise<void> {
  vendedores = vendedores.filter(v => v.id !== id);
  console.log("Mock deleteVendedor:", id);
  return Promise.resolve();
}
