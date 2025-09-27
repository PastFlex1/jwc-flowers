// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Customer } from '@/lib/types';
import { customers as mockCustomers } from '@/lib/mock-data';

let customers = [...mockCustomers];

export async function getCustomers(): Promise<Customer[]> {
  return Promise.resolve(customers);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customer = customers.find(c => c.id === id);
  return Promise.resolve(customer || null);
}

export async function addCustomer(customerData: Omit<Customer, 'id'>): Promise<string> {
  const newId = `customer-${Date.now()}`;
  const newCustomer: Customer = { id: newId, ...customerData };
  customers.push(newCustomer);
  console.log("Mock addCustomer:", newCustomer);
  return Promise.resolve(newId);
}

export async function updateCustomer(id: string, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> {
  customers = customers.map(c => c.id === id ? { ...c, ...customerData } : c);
  console.log("Mock updateCustomer:", id, customerData);
  return Promise.resolve();
}

export async function deleteCustomer(id: string): Promise<void> {
  customers = customers.filter(c => c.id !== id);
  console.log("Mock deleteCustomer:", id);
  return Promise.resolve();
}
