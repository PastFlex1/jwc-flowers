import { getDaes } from '@/services/daes';
import { DaeClient } from './dae-client';

export default async function DaePage() {
  const daes = await getDaes();
  return <DaeClient initialDaes={daes} />;
}
