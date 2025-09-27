'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import type { Pais, Vendedor, Customer, Finca, Carguera, Consignatario, Dae, Marcacion, Provincia, Invoice, Producto, CreditNote, DebitNote, Payment, Variedad } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { writeDb } from '@/lib/db-actions';
import initialDbData from '@/lib/db.json';

export type AppData = {
  paises: Pais[];
  vendedores: Vendedor[];
  customers: Customer[];
  fincas: Finca[];
  cargueras: Carguera[];
  consignatarios: Consignatario[];
  daes: Dae[];
  marcaciones: Marcacion[];
  provincias: Provincia[];
  invoices: Invoice[];
  productos: Producto[];
  variedades: Variedad[];
  creditNotes: CreditNote[];
  debitNotes: DebitNote[];
  payments: Payment[];
};

type AppDataContextType = AppData & {
  isLoading: boolean;
  hasBeenLoaded: boolean;
  refreshData: () => Promise<void>;
  updateAndRefreshData: (updatedData: Partial<AppData>) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// In-memory state for the demo
let memoryState: AppData = initialDbData as AppData;

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(memoryState);
  
  const [isLoading, setIsLoading] = useState(!memoryState);
  const [hasBeenLoaded, setHasBeenLoaded] = useState(!!memoryState);
  const { toast } = useToast();

  const fetchData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    // In a real app, this would fetch from a DB. For demo, we use the in-memory state.
    setData(memoryState);
    setHasBeenLoaded(true);
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    if (!hasBeenLoaded) {
      fetchData();
    }
  }, [fetchData, hasBeenLoaded]);
  
  const updateAndRefreshData = useCallback(async (updatedData: Partial<AppData>) => {
    const newData = { ...memoryState, ...updatedData };
    memoryState = newData; // Update in-memory state
    await writeDb(newData); // Write to file for local dev persistence
    setData(newData); // Update React state to trigger re-render
  }, []);


  const value = useMemo(() => ({
    ...data,
    isLoading,
    hasBeenLoaded,
    refreshData: fetchData,
    updateAndRefreshData,
  }), [data, isLoading, hasBeenLoaded, fetchData, updateAndRefreshData]);

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
