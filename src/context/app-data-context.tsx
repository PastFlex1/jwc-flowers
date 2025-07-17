'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import type { Pais, Vendedor, Customer, Finca, Carguera, Consignatario, Dae, Marcacion, Provincia, Invoice, Producto, CreditNote } from '@/lib/types';
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
import { cargueras as defaultCargueras } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

type AppDataContextType = {
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
  isLoading: boolean;
  refreshData: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [paises, setPaises] = useState<Pais[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [cargueras, setCargueras] = useState<Carguera[]>(defaultCargueras);
  const [consignatarios, setConsignatarios] = useState<Consignatario[]>([]);
  const [daes, setDaes] = useState<Dae[]>([]);
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
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
      ]);

      setPaises(paisesData);
      setVendedores(vendedoresData);
      setCustomers(customersData);
      setFincas(fincasData);
      setConsignatarios(consignatariosData);
      setDaes(daesData);
      setMarcaciones(marcacionesData);
      setProvincias(provinciasData);
      setInvoices(invoicesData);
      setProductos(productosData);
      setCreditNotes(creditNotesData);
      
      if (dbCargueras.length > 0) {
        setCargueras(dbCargueras);
      }

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value = useMemo(() => ({
    paises,
    vendedores,
    customers,
    fincas,
    cargueras,
    consignatarios,
    daes,
    marcaciones,
    provincias,
    invoices,
    productos,
    creditNotes,
    isLoading,
    refreshData: fetchData,
  }), [
    paises, 
    vendedores, 
    customers, 
    fincas, 
    cargueras, 
    consignatarios, 
    daes, 
    marcaciones, 
    provincias, 
    invoices,
    productos,
    creditNotes,
    isLoading, 
    fetchData
  ]);

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
