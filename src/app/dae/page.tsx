import { DaeClient } from './dae-client';
import { getDaes } from '@/services/daes';

export default async function DaePage() {
  const daesData = await getDaes();
  return <DaeClient initialDaes={daesData} />;
}
