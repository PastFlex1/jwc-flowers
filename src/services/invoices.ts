import type { Invoice } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

export async function getInvoices(): Promise<Invoice[]> {
  const db = await readDb();
  return db.invoices || [];
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<string> {
  const db = await readDb();
  const newId = `invoice-${Date.now()}`;
  const newInvoice: Invoice = { id: newId, ...invoiceData };
  db.invoices.unshift(newInvoice);
  await writeDb(db);
  return newId;
}

export async function updateInvoice(id: string, invoiceData: Partial<Omit<Invoice, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.invoices.findIndex(inv => inv.id === id);
  if (index > -1) {
    db.invoices[index] = { ...db.invoices[index], ...invoiceData } as Invoice;
    await writeDb(db);
  } else {
    throw new Error(`Invoice with id ${id} not found.`);
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  const db = await readDb();
  db.invoices = db.invoices.filter(inv => inv.id !== id);
  await writeDb(db);
}
