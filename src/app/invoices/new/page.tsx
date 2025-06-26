
import { getCustomers } from '@/services/customers';
import { getFincas } from '@/services/fincas';
import { getVendedores } from '@/services/vendedores';
import { getCargueras } from '@/services/cargueras';
import { getPaises } from '@/services/paises';
import { NewInvoiceForm } from './new-invoice-form';

export default async function NewInvoicePage() {
  const [customers, fincas, vendedores, cargueras, paises] = await Promise.all([
    getCustomers(),
    getFincas(),
    getVendedores(),
    getCargueras(),
    getPaises(),
  ]);

  return (
    <NewInvoiceForm
      customers={customers}
      fincas={fincas}
      vendedores={vendedores}
      cargueras={cargueras}
      paises={paises}
    />
  );
}
