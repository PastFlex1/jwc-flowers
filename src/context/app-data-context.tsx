'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import type { Pais, Vendedor, Customer, Finca, Carguera, Consignatario, Dae, Marcacion, Provincia, Invoice, Producto, CreditNote, DebitNote, Payment } from '@/lib/types';
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
import { getPayments } from '@/services/payments';
import { cargueras as defaultCargueras, provincias as defaultProvincias } from '@/lib/mock-data';
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
    cargueras: defaultCargueras,
    consignatarios: [],
    daes: [],
    marcaciones: [],
    provincias: defaultProvincias,
    invoices: [],
    productos: [],
    creditNotes: [],
    debitNotes: [],
    payments: [],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasBeenLoaded, setHasBeenLoaded] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async (): Promise<void> => {
    if (isLoading) return;
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
        dbProvincias,
        invoicesData,
        productosData,
        creditNotesData,
        debitNotesData,
        paymentsData,
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
        getPayments(),
      ]);

      const dbCarguerasNames = new Set(dbCargueras.map(c => c.nombreCarguera.toLowerCase()));
      const combinedCargueras = [...dbCargueras];
      defaultCargueras.forEach(dc => {
        if (!dbCarguerasNames.has(dc.nombreCarguera.toLowerCase())) {
          combinedCargueras.push(dc);
        }
      });
      
      const dbProvinciasNames = new Set(dbProvincias.map(p => p.nombre.toLowerCase()));
      const combinedProvincias = [...dbProvincias];
      defaultProvincias.forEach(dp => {
        if (!dbProvinciasNames.has(dp.nombre.toLowerCase())) {
          combinedProvincias.push(dp);
        }
      });

      setData({
        paises: paisesData,
        vendedores: vendedoresData,
        customers: customersData,
        fincas: fincasData,
        cargueras: combinedCargueras,
        consignatarios: consignatariosData,
        daes: daesData,
        marcaciones: marcacionesData,
        provincias: combinedProvincias,
        invoices: invoicesData,
        productos: productosData,
        creditNotes: creditNotesData,
        debitNotes: debitNotesData,
        payments: paymentsData,
      });
      setHasBeenLoaded(true);

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
  }, [toast, isLoading]);
  
  const hydrateData = useCallback((initialData: Partial<AppData>) => {
    setData(prevData => ({ ...prevData, ...initialData }));
    setHasBeenLoaded(true);
    setIsLoading(false);
  }, []);

  const value = useMemo(() => ({
    ...data,
    isLoading,
    hasBeenLoaded,
    refreshData: fetchData,
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
