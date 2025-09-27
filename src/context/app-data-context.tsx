
'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import type { Pais, Vendedor, Customer, Finca, Carguera, Consignatario, Dae, Marcacion, Provincia, Invoice, Producto, CreditNote, DebitNote, Payment, Variedad } from '@/lib/types';
import * as mockData from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

type AppData = {
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
  hydrateData: (initialData: Partial<AppData>) => void;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
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
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasBeenLoaded, setHasBeenLoaded] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async (): Promise<void> => {
    if (isLoading && !hasBeenLoaded) return;
    setIsLoading(true);
    
    // Simulate network delay for demo
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        // In demo mode, we just load from the mock data file.
        setData({
            paises: mockData.paises,
            vendedores: mockData.vendedores,
            customers: mockData.customers,
            fincas: mockData.fincas,
            cargueras: mockData.cargueras,
            consignatarios: mockData.consignatarios,
            daes: mockData.daes,
            marcaciones: mockData.marcaciones,
            provincias: mockData.provincias,
            invoices: mockData.invoices,
            productos: mockData.productos,
            variedades: mockData.variedades,
            creditNotes: mockData.creditNotes,
            debitNotes: mockData.debitNotes,
            payments: mockData.payments,
        });
      setHasBeenLoaded(true);
    } catch (error) {
      console.error("Failed to load mock data:", error);
      toast({
        title: 'Error de Carga',
        description: 'No se pudieron cargar los datos de demostración.',
        variant: 'destructive',
      });
    } finally {
        setIsLoading(false);
    }
  }, [toast, isLoading, hasBeenLoaded]);
  
  useEffect(() => {
    if (!hasBeenLoaded) {
        fetchData();
    }
  }, [fetchData, hasBeenLoaded]);


  const hydrateData = useCallback((initialData: Partial<AppData>) => {
    // This function is less relevant in demo mode but kept for structure.
    setData(prevData => ({ ...prevData, ...initialData }));
    setHasBeenLoaded(true);
    setIsLoading(false);
  }, []);

  const value = useMemo(() => ({
    ...data,
    isLoading,
    hasBeenLoaded,
    refreshData: fetchData, // Refresh will now just re-load mock data
    hydrateData,
  }), [data, isLoading, hasBeenLoaded, fetchData, hydrateData]);

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
