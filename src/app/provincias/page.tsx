import { getProvincias } from '@/services/provincias';
import { ProvinciasClient } from './provincias-client';

export default async function ProvinciasPage() {
  const provincias = await getProvincias();
  return <ProvinciasClient initialProvincias={provincias} />;
}
