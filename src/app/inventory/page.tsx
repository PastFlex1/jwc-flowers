// This page remains client-side for now due to its simple data requirements
// and direct interaction patterns that don't benefit as much from server-side fetching
// in this specific "get all" scenario. It can be refactored later if needed.
import { InventoryClient } from './inventory-client';

export default function InventoryPage() {
  return <InventoryClient />;
}
