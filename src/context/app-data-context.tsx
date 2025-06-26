'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Pais, Vendedor, Customer, Finca, Carguera, Consignatario, Dae, Marcacion, Provincia } from '@/lib/types';
import { getPaises } from '@/services/paises';
import { getVendedores } from '@/services/vendedores';
import { getCustomers } from '@/services/customers';
import { getFincas } from '@/services/fincas';
import { getCargueras } from '@/services/cargueras';
import { getConsignatarios } from '@/services/consignatarios';
import { getDaes } from '@/services/daes';
import { getMarcaciones } from '@/services/marcaciones';
import { getProvincias } from '@/services/provincias';
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
      ]);

      setPaises(paisesData);
      setVendedores(vendedoresData);
      setCustomers(customersData);
      setFincas(fincasData);
      setConsignatarios(consignatariosData);
      setDaes(daesData);
      setMarcaciones(marcacionesData);
      setProvincias(provinciasData);
      
      if (dbCargueras.length > 0) {
        setCargueras(dbCargueras);
      } else {
        setCargueras(defaultCargueras);
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
    isLoading,
    refreshData: fetchData,
  };

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
