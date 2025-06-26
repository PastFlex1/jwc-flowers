'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Pais, Vendedor, Customer, Finca, Carguera, Consignatario, Dae, Marcacion, Provincia, Invoice } from '@/lib/types';
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
  isLoading: boolean;
  refreshData: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

function AppDataLoadingScreen() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
             <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-muted-foreground">Sincronizando datos...</p>
            </div>
        </div>
    );
}

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
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    // We don't set isLoading to true here on purpose, so that refreshes don't show the main loading screen.
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
      
      // Only override the default cargueras if there's data in the DB
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
      // This will only be set to false once on initial load, hiding the loading screen.
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value = {
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
    isLoading,
    refreshData: fetchData,
  };

  return (
    <AppDataContext.Provider value={value}>
      {isLoading ? <AppDataLoadingScreen /> : children}
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
