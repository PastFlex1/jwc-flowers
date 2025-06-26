import { VendedoresClient } from './vendedores-client';
import { getVendedores } from '@/services/vendedores';

export default async function VendedoresPage() {
  const vendedoresData = await getVendedores();
  return <VendedoresClient initialVendedores={vendedoresData} />;
}
