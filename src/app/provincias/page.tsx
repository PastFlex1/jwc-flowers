import { ProvinciasClient } from './provincias-client';
import { getProvincias } from '@/services/provincias';

export default async function ProvinciasPage() {
  const provinciasData = await getProvincias();
  return <ProvinciasClient initialProvincias={provinciasData} />;
}
