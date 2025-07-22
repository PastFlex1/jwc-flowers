'use client';

import { useEffect } from 'react';
import { useAppData } from '@/context/app-data-context';
import type { Pais, Vendedor, Customer, Finca, Carguera, Consignatario, Dae, Marcacion, Provincia, Invoice, Producto, CreditNote, DebitNote } from '@/lib/types';

type HydrationProps = {
  paises?: Pais[];
  vendedores?: Vendedor[];
  customers?: Customer[];
  fincas?: Finca[];
  cargueras?: Carguera[];
  consignatarios?: Consignatario[];
  daes?: Dae[];
  marcaciones?: Marcacion[];
  provincias?: Provincia[];
  invoices?: Invoice[];
  productos?: Producto[];
  creditNotes?: CreditNote[];
  debitNotes?: DebitNote[];
}

export function DataHydrator(props: HydrationProps) {
  const { hydrateData } = useAppData();

  useEffect(() => {
    hydrateData(props);
  }, [props, hydrateData]);

  return null; // This component does not render anything
}
