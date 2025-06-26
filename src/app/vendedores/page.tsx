import { getVendedores } from '@/services/vendedores';
import { VendedoresClient } from './vendedores-client';

export default async function VendedoresPage() {
  const vendedores = await getVendedores();
  return <VendedoresClient initialVendedores={vendedores} />;
}
