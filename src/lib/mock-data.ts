import { type Customer, type InventoryItem, type Invoice, type Finca, type Marcacion, type Pais, type Provincia, type Dae, type Carguera, type Vendedor } from './types';

// Data is now fetched from Firestore. These are exported as empty arrays 
// to avoid breaking imports in components during migration.
export const customers: Customer[] = [];
export const inventory: InventoryItem[] = [];
export const invoices: Invoice[] = [];
export const fincas: Finca[] = [];
export const vendedores: Vendedor[] = [];
export const marcaciones: Marcacion[] = [];
export const paises: Pais[] = [];
export const provincias: Provincia[] = [];
export const daes: Dae[] = [];
export const cargueras: Carguera[] = [];
