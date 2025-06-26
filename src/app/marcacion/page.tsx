import { MarcacionClient } from './marcacion-client';
import { getMarcaciones } from '@/services/marcaciones';

export default async function MarcacionPage() {
  const marcacionesData = await getMarcaciones();
  return <MarcacionClient initialMarcaciones={marcacionesData} />;
}
