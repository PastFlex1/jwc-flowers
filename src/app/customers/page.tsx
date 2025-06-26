import { CustomersClient } from './customers-client';
import { getCustomers } from '@/services/customers';
import { getPaises } from '@/services/paises';
import { getCargueras } from '@/services/cargueras';
import { getVendedores } from '@/services/vendedores';
import { cargueras as defaultCargueras } from '@/lib/mock-data';

export default async function CustomersPage() {
  let carguerasData = await getCargueras();
  if (carguerasData.length === 0) {
    carguerasData = defaultCargueras;
  }
  
  const [customersData, paisesData, vendedoresData] = await Promise.all([
    getCustomers(),
    getPaises(),
    getVendedores(),
  ]);

  return (
    <CustomersClient
      initialCustomers={customersData}
      paises={paisesData}
      cargueras={carguerasData}
      vendedores={vendedoresData}
    />
  );
}
