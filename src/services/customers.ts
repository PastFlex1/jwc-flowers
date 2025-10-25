// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Customer } from '@/lib/types';

export function getCustomers() {
  return useAppData().customers;
}

export function addCustomer(data: Omit<Customer, 'id'>) {
  return useAppData().addCustomer(data);
}

export function updateCustomer(id: string, data: Partial<Omit<Customer, 'id'>>) {
  return useAppData().updateCustomer(id, data);
}

export function deleteCustomer(id: string) {
  return useAppData().deleteCustomer(id);
}
