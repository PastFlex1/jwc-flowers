'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import type { Pais, Vendedor, Customer, Finca, Carguera, Consignatario, Dae, Marcacion, Provincia, Invoice, Producto, CreditNote, DebitNote, Payment, Variedad } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { readDb, writeDb } from '@/lib/db-actions';

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

const initialEmptyData: AppData = {
    paises: [],
    vendedores: [],
    customers: [],
    fincas: [],
    cargueras: [],
    consignatarios: [],
    daes: [],
    marcaciones: [],
    provincias: [],
    invoices: [],
    productos: [],
    variedades: [],
    creditNotes: [],
    debitNotes: [],
    payments: [],
};


export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialEmptyData);
  const [isLoading, setIsLoading] = useState(true);
  const [hasBeenLoaded, setHasBeenLoaded] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
        const dbData = await readDb();
        setData(dbData);
        setHasBeenLoaded(true);
    } catch (error) {
        console.error("Failed to load local DB data", error);
        toast({
            title: "Error de Carga",
            description: "No se pudieron cargar los datos de demostración.",
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (!hasBeenLoaded) {
      fetchData();
    }
  }, [fetchData, hasBeenLoaded]);
  
  const updateAndRefreshData = useCallback(async (updatedData: Partial<AppData>) => {
    const currentData = await readDb();
    const newData = { ...currentData, ...updatedData };
    await writeDb(newData);
    await fetchData();
  }, [fetchData]);


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
