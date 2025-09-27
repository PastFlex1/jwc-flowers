// This file is no longer used for data storage.
// Data is now read from and written to src/lib/db.json.
// The empty arrays are kept to prevent breaking imports, though they are no longer the source of truth.
import { type Customer, type Invoice, type Finca, type Marcacion, type Pais, type Provincia, type Dae, type Carguera, type Vendedor, type Consignatario, type Producto, type Variedad, type CreditNote, type DebitNote, type Payment } from './types';

export const customers: Customer[] = [];
export const invoices: Invoice[] = [];
export const fincas: Finca[] = [];
export const vendedores: Vendedor[] = [];
export const marcaciones: Marcacion[] = [];
export const paises: Pais[] = [];
export const daes: Dae[] = [];
export const consignatarios: Consignatario[] = [];
export const productos: Producto[] = [];
export const variedades: Variedad[] = [];
export const creditNotes: CreditNote[] = [];
export const debitNotes: DebitNote[] = [];
export const payments: Payment[] = [];
export const provincias: Provincia[] = [];
export const cargueras: Carguera[] = [];
