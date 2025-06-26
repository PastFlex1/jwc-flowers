import { InvoicesClient } from './invoices-client';
import { getCustomers } from '@/services/customers';
import { getInvoices } from '@/services/invoices';

export default async function InvoicesPage() {
  const [invoicesData, customersData] = await Promise.all([
    getInvoices(),
    getCustomers(),
  ]);
  
  const customerMap = customersData.reduce((acc, customer) => {
    acc[customer.id] = customer.name;
    return acc;
  }, {} as Record<string, string>);

  return <InvoicesClient initialInvoices={invoicesData} customerMap={customerMap} />;
}
