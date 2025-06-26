import { FincasClient } from './fincas-client';
import { getFincas } from '@/services/fincas';

export default async function FincasPage() {
  const fincasData = await getFincas();
  return <FincasClient initialFincas={fincasData} />;
}
