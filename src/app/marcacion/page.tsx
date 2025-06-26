import { getMarcaciones } from '@/services/marcaciones';
import { MarcacionClient } from './marcacion-client';

export default async function MarcacionPage() {
  const marcaciones = await getMarcaciones();
  return <MarcacionClient initialMarcaciones={marcaciones} />;
}
