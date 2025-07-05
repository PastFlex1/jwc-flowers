'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

type InvoiceActionsProps = {
  // Props are no longer needed as this component is simplified
};

export function InvoiceActions({}: InvoiceActionsProps) {
  const router = useRouter();

  return (
    <>
      <Button variant="outline" onClick={() => router.back()}>
        Volver
      </Button>
    </>
  );
}
