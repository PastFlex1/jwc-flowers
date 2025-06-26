import { getPaises } from '@/services/paises';
import { PaisClient } from './pais-client';

export default async function PaisPage() {
  const paises = await getPaises();
  return <PaisClient initialPaises={paises} />;
}
