import { CarguerasClient } from './cargueras-client';
import { getCargueras } from '@/services/cargueras';
import { cargueras as defaultCargueras } from '@/lib/mock-data';

export default async function CarguerasPage() {
  let carguerasData = await getCargueras();
  // If the database is empty, fallback to the default list from mock-data
  if (carguerasData.length === 0) {
      carguerasData = defaultCargueras;
  }
  return <CarguerasClient initialCargueras={carguerasData} />;
}
