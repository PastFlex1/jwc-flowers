import { getCustomers } from '@/services/customers';
import { CustomersClient } from './customers-client';

export default async function CustomersPage() {
  const customers = await getCustomers();
  return <CustomersClient initialCustomers={customers} />;
}
