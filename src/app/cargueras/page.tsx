import { getCargueras } from '@/services/cargueras';
import { CarguerasClient } from './cargueras-client';

export default async function CarguerasPage() {
  const cargueras = await getCargueras();

  return <CarguerasClient initialCargueras={cargueras} />;
}
