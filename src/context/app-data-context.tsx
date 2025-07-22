'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import type { Pais, Vendedor, Customer, Finca, Carguera, Consignatario, Dae, Marcacion, Provincia, Invoice, Producto, CreditNote, DebitNote } from '@/lib/types';
import { getPaises } from '@/services/paises';
import { getVendedores } from '@/services/vendedores';
import { getCustomers } from '@/services/customers';
import { getFincas } from '@/services/fincas';
import { getCargueras } from '@/services/cargueras';
import { getConsignatarios } from '@/services/consignatarios';
import { getDaes } from '@/services/daes';
import { getMarcaciones } from '@/services/marcaciones';
import { getProvincias } from '@/services/provincias';
import { getInvoices } from '@/services/invoices';
import { getProductos } from '@/services/productos';
import { getCreditNotes } from '@/services/credit-notes';
import { getDebitNotes } from '@/services/debit-notes';
import { cargueras as defaultCargueras } from '@/lib/mock-data';
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
  creditNotes: CreditNote[];
  debitNotes: DebitNote[];
};

type AppDataContextType = AppData & {
  isLoading: boolean;
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
    cargueras: defaultCargueras,
    consignatarios: [],
    daes: [],
    marcaciones: [],
    provincias: [],
    invoices: [],
    productos: [],
    creditNotes: [],
    debitNotes: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        paisesData,
        vendedoresData,
        customersData,
        fincasData,
        dbCargueras,
        consignatariosData,
        daesData,
        marcacionesData,
        provinciasData,
        invoicesData,
        productosData,
        creditNotesData,
        debitNotesData,
      ] = await Promise.all([
        getPaises(),
        getVendedores(),
        getCustomers(),
        getFincas(),
        getCargueras(),
        getConsignatarios(),
        getDaes(),
        getMarcaciones(),
        getProvincias(),
        getInvoices(),
        getProductos(),
        getCreditNotes(),
        getDebitNotes(),
      ]);

      setData({
        paises: paisesData,
        vendedores: vendedoresData,
        customers: customersData,
        fincas: fincasData,
        cargueras: dbCargueras.length > 0 ? dbCargueras : defaultCargueras,
        consignatarios: consignatariosData,
        daes: daesData,
        marcaciones: marcacionesData,
        provincias: provinciasData,
        invoices: invoicesData,
        productos: productosData,
        creditNotes: creditNotesData,
        debitNotes: debitNotesData,
      });

    } catch (error) {
      console.error("Failed to fetch global app data:", error);
      toast({
        title: 'Error de Sincronización',
        description: 'No se pudieron cargar algunos datos. Por favor, revise su conexión y la configuración de Firebase.',
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  const hydrateData = useCallback((initialData: Partial<AppData>) => {
    setData(prevData => ({ ...prevData, ...initialData }));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Initial fetch if no data is hydrated from a server component
    if (isLoading) {
      fetchData();
    }
  }, [fetchData, isLoading]);

  const value = useMemo(() => ({
    ...data,
    isLoading,
    refreshData: fetchData,
    hydrateData,
  }), [data, isLoading, fetchData, hydrateData]);

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
