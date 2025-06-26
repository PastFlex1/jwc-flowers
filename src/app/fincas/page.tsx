import { getFincas } from '@/services/fincas';
import { FincasClient } from './fincas-client';

export default async function FincasPage() {
  const fincas = await getFincas();
  return <FincasClient initialFincas={fincas} />;
}
