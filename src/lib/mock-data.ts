import { type Customer, type InventoryItem, type Invoice, type Finca, type Marcacion, type Pais, type Provincia, type Dae, type Carguera, type Vendedor } from './types';

// Data is now fetched from Firestore. These are exported as empty arrays 
// to avoid breaking imports in components during migration.
export const customers: Customer[] = [];
export const inventory: InventoryItem[] = [];
export const invoices: Invoice[] = [];
export const fincas: Finca[] = [];
export const vendedores: Vendedor[] = [];
export const marcaciones: Marcacion[] = [];
export const paises: Pais[] = [];
export const provincias: Provincia[] = [];
export const daes: Dae[] = [];

export const cargueras: Carguera[] = [
    { id: 'car-01', nombreCarguera: 'ALIANZA LOGISTIC/G&G', pais: 'Internacional' },
    { id: 'car-02', nombreCarguera: 'CARGO MASTER /DSV/PANALPINA', pais: 'Internacional' },
    { id: 'car-03', nombreCarguera: 'CEVA CARGO/CIMA CARGO', pais: 'Internacional' },
    { id: 'car-04', nombreCarguera: 'CHAMPION AIR CARGO', pais: 'Internacional' },
    { id: 'car-05', nombreCarguera: 'D Y CARGO', pais: 'Internacional' },
    { id: 'car-06', nombreCarguera: 'DIRECT CARGO', pais: 'Internacional' },
    { id: 'car-07', nombreCarguera: 'EBF CARGO', pais: 'Internacional' },
    { id: 'car-08', nombreCarguera: 'ECUADOR CARGO', pais: 'Internacional' },
    { id: 'car-09', nombreCarguera: 'FLORAL TECH-LOGIKE CARGO', pais: 'Internacional' },
    { id: 'car-10', nombreCarguera: 'FLOWER CARGO', pais: 'Internacional' },
    { id: 'car-11', nombreCarguera: 'FRESH LINK', pais: 'Internacional' },
    { id: 'car-12', nombreCarguera: 'FRESH LOGISTIK', pais: 'Internacional' },
    { id: 'car-13', nombreCarguera: 'GREEN LOGISTIC', pais: 'Internacional' },
    { id: 'car-14', nombreCarguera: 'HP APOLLO', pais: 'Internacional' },
    { id: 'car-15', nombreCarguera: 'KHUENE NAGEL', pais: 'Internacional' },
    { id: 'car-16', nombreCarguera: 'LOGISTI USA/PANATLANTIC', pais: 'Internacional' },
    { id: 'car-17', nombreCarguera: 'ONE TEAM CARGO', pais: 'Internacional' },
    { id: 'car-18', nombreCarguera: 'OPERFLOR', pais: 'Internacional' },
    { id: 'car-19', nombreCarguera: 'PACIFIC AIR CARGO', pais: 'Internacional' },
    { id: 'car-20', nombreCarguera: 'PG CARGO', pais: 'Internacional' },
    { id: 'car-21', nombreCarguera: 'SAFTEC', pais: 'Internacional' },
    { id: 'car-22', nombreCarguera: 'UPS SAFTEC', pais: 'Internacional' },
    { id: 'car-23', nombreCarguera: 'SIERRA CARGO', pais: 'Internacional' },
    { id: 'car-24', nombreCarguera: 'VALUE CARGO', pais: 'Internacional' },
    { id: 'car-25', nombreCarguera: 'WORLD WIDE', pais: 'Internacional' },
    { id: 'car-26', nombreCarguera: 'AEROFLOR', pais: 'Nacional' },
    { id: 'car-27', nombreCarguera: 'AEROMUNDO', pais: 'Nacional' },
    { id: 'car-28', nombreCarguera: 'AIR CARGO', pais: 'Nacional' },
    { id: 'car-29', nombreCarguera: 'AIR LOGIST', pais: 'Nacional' },
    { id: 'car-30', nombreCarguera: 'FASTCARGO', pais: 'Nacional' },
    { id: 'car-31', nombreCarguera: 'FLOR CARGO', pais: 'Nacional' },
    { id: 'car-32', nombreCarguera: 'FLORBOX', pais: 'Nacional' },
    { id: 'car-33', nombreCarguera: 'FLORCAR', pais: 'Nacional' },
    { id: 'car-34', nombreCarguera: 'INTERCARGO', pais: 'Nacional' },
    { id: 'car-35', nombreCarguera: 'LARA', pais: 'Nacional' },
    { id: 'car-36', nombreCarguera: 'LOGISTCARGO', pais: 'Nacional' },
    { id: 'car-37', nombreCarguera: 'PROCESADORA EL CISNE', pais: 'Nacional' },
    { id: 'car-38', nombreCarguera: 'SERVFLOR', pais: 'Nacional' },
    { id: 'car-39', nombreCarguera: 'SERTILOG', pais: 'Nacional' },
    { id: 'car-40', nombreCarguera: 'SKY', pais: 'Nacional' },
    { id: 'car-41', nombreCarguera: 'TRANSCARGA', pais: 'Nacional' },
    { id: 'car-42', nombreCarguera: 'TRANSFLOR', pais: 'Nacional' },
    { id: 'car-43', nombreCarguera: 'TRANS FLOWER', pais: 'Nacional' },
    { id: 'car-44', nombreCarguera: 'TRANSNEV', pais: 'Nacional' },
    { id: 'car-45', nombreCarguera: 'TRANS NEVADA', pais: 'Nacional' },
];
