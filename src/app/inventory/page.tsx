import { getInventoryItems } from '@/services/inventory';
import { InventoryClient } from './inventory-client';

export default async function InventoryPage() {
  const items = await getInventoryItems();
  return <InventoryClient initialInventory={items} />;
}
