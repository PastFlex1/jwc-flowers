import { ConsignatariosClient } from './consignatarios-client';
import { getConsignatarios } from '@/services/consignatarios';
import { getPaises } from '@/services/paises';
import { getCustomers } from '@/services/customers';

export default async function ConsignatariosPage() {
  const [consignatariosData, paisesData, customersData] = await Promise.all([
      getConsignatarios(),
      getPaises(),
      getCustomers(),
  ]);

  const customerMap = customersData.reduce((acc, customer) => {
    acc[customer.id] = customer.name;
    return acc;
  }, {} as Record<string, string>);

  return (
    <ConsignatariosClient
      initialConsignatarios={consignatariosData}
      paises={paisesData}
      customers={customersData}
      customerMap={customerMap}
    />
  );
}
