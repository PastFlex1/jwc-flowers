import { CarguerasClient } from './cargueras-client';

export default function CarguerasPage() {
  // Data is now handled globally by AppDataProvider, ensuring dynamic updates.
  // No need to pre-fetch or hydrate here.
  return <CarguerasClient />;
}
