import type { Customer } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';

export async function getCustomers(): Promise<Customer[]> {
  const db = await readDb();
  return db.customers || [];
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<string> {
  const db = await readDb();
  const newId = `customer-${Date.now()}`;
  const newCustomer: Customer = { id: newId, ...customerData };
  db.customers.push(newCustomer);
  await writeDb(db);
  return newId;
}

export async function updateCustomer(id: string, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> {
  const db = await readDb();
  const index = db.customers.findIndex(c => c.id === id);
  if (index > -1) {
    db.customers[index] = { ...db.customers[index], ...customerData };
    await writeDb(db);
  } else {
    throw new Error(`Customer with id ${id} not found.`);
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = await readDb();
  db.customers = db.customers.filter(c => c.id !== id);
  await writeDb(db);
}
