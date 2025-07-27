import { getCargueras } from '@/services/cargueras';
import { DataHydrator } from '@/components/layout/data-hydrator';
import { CarguerasClient } from './cargueras-client';

export default async function CarguerasPage() {
  const cargueras = await getCargueras();

  return (
    <>
      <DataHydrator cargueras={cargueras} />
      <CarguerasClient />
    </>
  );
}
