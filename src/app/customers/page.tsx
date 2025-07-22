import { getCustomers } from '@/services/customers';
import { getPaises } from '@/services/paises';
import { getCargueras } from '@/services/cargueras';
import { getVendedores } from '@/services/vendedores';
import { getDaes } from '@/services/daes';
import { DataHydrator } from '@/components/layout/data-hydrator';
import { CustomersClient } from './customers-client';

export default async function CustomersPage() {
  const [customers, paises, cargueras, vendedores, daes] = await Promise.all([
    getCustomers(),
    getPaises(),
    getCargueras(),
    getVendedores(),
    getDaes(),
  ]);

  return (
    <>
      <DataHydrator 
        customers={customers} 
        paises={paises} 
        cargueras={cargueras}
        vendedores={vendedores}
        daes={daes}
      />
      <CustomersClient />
    </>
  );
}
