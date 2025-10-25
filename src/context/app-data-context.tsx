'use client';

import { createContext, useContext, useState, useCallback, type ReactNode, useMemo } from 'react';
import type { Pais, Vendedor, Customer, Finca, Carguera, Consignatario, Dae, Marcacion, Provincia, Invoice, Producto, CreditNote, DebitNote, Payment, Variedad } from '@/lib/types';
import initialDbData from '@/lib/db.json';

// DEMO LIMITS
const DEMO_LIMITS = {
  paises: 10,
  vendedores: 5,
  customers: 5,
  fincas: 5,
  cargueras: 10,
  consignatarios: 10,
  daes: 10,
  marcaciones: 10,
  provincias: 10,
  invoices: 5,
  productos: 20,
  variedades: 10,
  creditNotes: 20,
  debitNotes: 20,
  payments: 50,
};

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
  refreshData: () => void;
  
  // Service function replacements
  addPais: (data: Omit<Pais, 'id'>) => Promise<void>;
  updatePais: (id: string, data: Partial<Omit<Pais, 'id'>>) => Promise<void>;
  deletePais: (id: string) => Promise<void>;

  addVendedor: (data: Omit<Vendedor, 'id'>) => Promise<void>;
  updateVendedor: (id: string, data: Partial<Omit<Vendedor, 'id'>>) => Promise<void>;
  deleteVendedor: (id: string) => Promise<void>;

  addCustomer: (data: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Omit<Customer, 'id'>>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addFinca: (data: Omit<Finca, 'id'>) => Promise<void>;
  updateFinca: (id: string, data: Partial<Omit<Finca, 'id'>>) => Promise<void>;
  deleteFinca: (id: string) => Promise<void>;

  addCarguera: (data: Omit<Carguera, 'id'>) => Promise<void>;
  updateCarguera: (id: string, data: Partial<Omit<Carguera, 'id'>>) => Promise<void>;
  deleteCarguera: (id: string) => Promise<void>;
  
  addConsignatario: (data: Omit<Consignatario, 'id'>) => Promise<void>;
  updateConsignatario: (id: string, data: Partial<Omit<Consignatario, 'id'>>) => Promise<void>;
  deleteConsignatario: (id: string) => Promise<void>;

  addDae: (data: Omit<Dae, 'id'>) => Promise<void>;
  updateDae: (id: string, data: Partial<Omit<Dae, 'id'>>) => Promise<void>;
  deleteDae: (id: string) => Promise<void>;

  addMarcacion: (data: Omit<Marcacion, 'id'>) => Promise<void>;
  updateMarcacion: (id: string, data: Partial<Omit<Marcacion, 'id'>>) => Promise<void>;
  deleteMarcacion: (id: string) => Promise<void>;

  addProvincia: (data: Omit<Provincia, 'id'>) => Promise<void>;
  updateProvincia: (id: string, data: Partial<Omit<Provincia, 'id'>>) => Promise<void>;
  deleteProvincia: (id: string) => Promise<void>;

  addInvoice: (data: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoice: (id: string, data: Partial<Omit<Invoice, 'id'>>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  
  addProducto: (data: Omit<Producto, 'id'>) => Promise<void>;
  updateProducto: (id: string, data: Partial<Omit<Producto, 'id'>>) => Promise<void>;
  deleteProducto: (id: string) => Promise<void>;

  addVariedad: (data: Omit<Variedad, 'id'>) => Promise<void>;
  deleteVariedad: (id: string) => Promise<void>;

  addCreditNote: (data: Omit<CreditNote, 'id'>) => Promise<void>;
  deleteCreditNote: (id: string) => Promise<void>;

  addDebitNote: (data: Omit<DebitNote, 'id'>) => Promise<void>;
  deleteDebitNote: (id: string) => Promise<void>;

  addBulkPayment: (paymentData: Omit<Payment, 'id' | 'invoiceId' | 'amount'>, invoiceBalances: { invoiceId: string; balance: number }[], totalAmountToApply: number) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialDbData as AppData);
  const isLoading = false;
  const hasBeenLoaded = true;

  const refreshData = useCallback(() => {
    // In a local-only model, refresh could reset to initial state if desired.
    // For now, it does nothing as state is managed live.
  }, []);

  const createService = <T extends { id: string }>(
    key: keyof AppData,
    idPrefix: string,
    limit: number
  ) => {
    const add = async (itemData: Omit<T, 'id'>) => {
      setData(prevData => {
        const collection = prevData[key] as T[];
        if (collection.length >= limit) {
          throw new Error(`Límite de demostración alcanzado. No se pueden crear más de ${limit} registros.`);
        }
        const newItem = { id: `${idPrefix}-${Date.now()}`, ...itemData } as T;
        return { ...prevData, [key]: [...collection, newItem] };
      });
    };

    const update = async (id: string, itemData: Partial<Omit<T, 'id'>>) => {
      setData(prevData => {
        const collection = prevData[key] as T[];
        const index = collection.findIndex(item => item.id === id);
        if (index === -1) throw new Error(`${idPrefix} with id ${id} not found.`);
        const updatedItem = { ...collection[index], ...itemData };
        const newCollection = [...collection];
        newCollection[index] = updatedItem;
        return { ...prevData, [key]: newCollection };
      });
    };

    const remove = async (id: string) => {
       setData(prevData => {
        const collection = prevData[key] as T[];
        const newCollection = collection.filter(item => item.id !== id);
        return { ...prevData, [key]: newCollection };
      });
    };
    
    return { add, update, remove };
  };

  const paisServices = createService<Pais>('paises', 'pais', DEMO_LIMITS.paises);
  const vendedorServices = createService<Vendedor>('vendedores', 'vendedor', DEMO_LIMITS.vendedores);
  const customerServices = createService<Customer>('customers', 'customer', DEMO_LIMITS.customers);
  const fincaServices = createService<Finca>('fincas', 'finca', DEMO_LIMITS.fincas);
  const cargueraServices = createService<Carguera>('cargueras', 'carguera', DEMO_LIMITS.cargueras);
  const consignatarioServices = createService<Consignatario>('consignatarios', 'consignatario', DEMO_LIMITS.consignatarios);
  const daeServices = createService<Dae>('daes', 'dae', DEMO_LIMITS.daes);
  const marcacionServices = createService<Marcacion>('marcaciones', 'marcacion', DEMO_LIMITS.marcaciones);
  const provinciaServices = createService<Provincia>('provincias', 'provincia', DEMO_LIMITS.provincias);
  const invoiceServices = createService<Invoice>('invoices', 'invoice', DEMO_LIMITS.invoices);
  const productoServices = createService<Producto>('productos', 'producto', DEMO_LIMITS.productos);
  const creditNoteServices = createService<CreditNote>('creditNotes', 'creditNote', DEMO_LIMITS.creditNotes);
  const debitNoteServices = createService<DebitNote>('debitNotes', 'debitNote', DEMO_LIMITS.debitNotes);

  const addVariedad = async (variedadData: Omit<Variedad, 'id'>) => {
    setData(prevData => {
        if (prevData.variedades.length >= DEMO_LIMITS.variedades) {
          throw new Error(`Límite de demostración alcanzado. No se pueden crear más de ${DEMO_LIMITS.variedades} variedades.`);
        }
        const newVariedad: Variedad = { id: `var-${Date.now()}`, ...variedadData };
        return { ...prevData, variedades: [...prevData.variedades, newVariedad] };
      });
  };
  
  const deleteVariedad = async (id: string) => {
     setData(prevData => {
      const varietyToDelete = prevData.variedades.find(v => v.id === id);
      if (!varietyToDelete) {
        throw new Error(`Variedad with id ${id} not found.`);
      }
      const productsUsingVariety = prevData.productos.filter(p => p.variedad === varietyToDelete.nombre);
      if (productsUsingVariety.length > 0) {
        throw new Error(`No se puede eliminar la variedad porque está siendo utilizada por ${productsUsingVariety.length} producto(s).`);
      }
      return { ...prevData, variedades: prevData.variedades.filter(v => v.id !== id) };
    });
  };

  const addBulkPayment = async (paymentData: Omit<Payment, 'id' | 'invoiceId' | 'amount'>, invoiceBalances: { invoiceId: string; balance: number }[], totalAmountToApply: number) => {
    setData(prevData => {
        if (prevData.payments.length >= DEMO_LIMITS.payments) {
             throw new Error(`Límite de demostración alcanzado. No se pueden crear más de ${DEMO_LIMITS.payments} registros de pago.`);
        }
        let remainingAmount = totalAmountToApply;
        const newPayments: Payment[] = [];
        const updatedInvoices = [...prevData.invoices];

        for (const { invoiceId, balance } of invoiceBalances) {
            if (remainingAmount <= 0) break;
            const paymentAmountForInvoice = Math.min(remainingAmount, balance);
            
            const newPayment: Payment = {
              id: `payment-${Date.now()}-${Math.random()}`,
              ...paymentData,
              invoiceId: invoiceId,
              amount: paymentAmountForInvoice,
            };
            newPayments.push(newPayment);

            remainingAmount -= paymentAmountForInvoice;
        }

        return { ...prevData, payments: [...prevData.payments, ...newPayments] };
    });
  };
  
  const value = useMemo(() => ({
    ...data,
    isLoading,
    hasBeenLoaded,
    refreshData,
    addPais: paisServices.add,
    updatePais: paisServices.update,
    deletePais: paisServices.remove,
    addVendedor: vendedorServices.add,
    updateVendedor: vendedorServices.update,
    deleteVendedor: vendedorServices.remove,
    addCustomer: customerServices.add,
    updateCustomer: customerServices.update,
    deleteCustomer: customerServices.remove,
    addFinca: fincaServices.add,
    updateFinca: fincaServices.update,
    deleteFinca: fincaServices.remove,
    addCarguera: cargueraServices.add,
    updateCarguera: cargueraServices.update,
    deleteCarguera: cargueraServices.remove,
    addConsignatario: consignatarioServices.add,
    updateConsignatario: consignatarioServices.update,
    deleteConsignatario: consignatarioServices.remove,
    addDae: daeServices.add,
    updateDae: daeServices.update,
    deleteDae: daeServices.remove,
    addMarcacion: marcacionServices.add,
    updateMarcacion: marcacionServices.update,
    deleteMarcacion: marcacionServices.remove,
    addProvincia: provinciaServices.add,
    updateProvincia: provinciaServices.update,
    deleteProvincia: provinciaServices.remove,
    addInvoice: invoiceServices.add,
    updateInvoice: invoiceServices.update,
    deleteInvoice: invoiceServices.remove,
    addProducto: productoServices.add,
    updateProducto: productoServices.update,
    deleteProducto: productoServices.remove,
    addVariedad,
    deleteVariedad,
    addCreditNote: creditNoteServices.add,
    deleteCreditNote: creditNoteServices.remove,
    addDebitNote: debitNoteServices.add,
    deleteDebitNote: debitNoteServices.remove,
    addBulkPayment
  }), [data, isLoading, hasBeenLoaded, refreshData, paisServices, vendedorServices, customerServices, fincaServices, cargueraServices, consignatarioServices, daeServices, marcacionServices, provinciaServices, invoiceServices, productoServices]);

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
