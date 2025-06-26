import { PaisClient } from './pais-client';
import { getPaises } from '@/services/paises';

export default async function PaisPage() {
  const paisesData = await getPaises();
  return <PaisClient initialPaises={paisesData} />;
}
