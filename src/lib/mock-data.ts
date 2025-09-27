import { type Customer, type Invoice, type Finca, type Marcacion, type Pais, type Provincia, type Dae, type Carguera, type Vendedor, type Consignatario, type Producto, type Variedad, type CreditNote, type DebitNote, type Payment } from './types';

// Data is now fetched from Firestore. These are exported as empty arrays 
// to avoid breaking imports in components during migration.
export const customers: Customer[] = [];
export const invoices: Invoice[] = [];
export const fincas: Finca[] = [];
export const vendedores: Vendedor[] = [];
export const marcaciones: Marcacion[] = [];
export const paises: Pais[] = [];
export const daes: Dae[] = [];
export const consignatarios: Consignatario[] = [];
export const productos: Producto[] = [];
export const variedades: Variedad[] = [];
export const creditNotes: CreditNote[] = [];
export const debitNotes: DebitNote[] = [];
export const payments: Payment[] = [];


export const provincias: Provincia[] = [
    { id: 'prov-01', nombre: 'El Oro' },
    { id: 'prov-02', nombre: 'Esmeraldas' },
    { id: 'prov-03', nombre: 'Guayas' },
    { id: 'prov-04', nombre: 'Los Ríos' },
    { id: 'prov-05', nombre: 'Manabí' },
    { id: 'prov-06', nombre: 'Santa Elena' },
    { id: 'prov-07', nombre: 'Santo Domingo de los Tsáchilas' },
    { id: 'prov-08', nombre: 'Azuay' },
    { id: 'prov-09', nombre: 'Bolívar' },
    { id: 'prov-10', nombre: 'Cañar' },
    { id: 'prov-11', nombre: 'Carchi' },
    { id: 'prov-12', nombre: 'Chimborazo' },
    { id: 'prov-13', nombre: 'Cotopaxi' },
    { id: 'prov-14', nombre: 'Imbabura' },
    { id: 'prov-15', nombre: 'Loja' },
    { id: 'prov-16', nombre: 'Pichincha' },
    { id: 'prov-17', nombre: 'Tungurahua' },
    { id: 'prov-18', nombre: 'Galápagos' },
    { id: 'prov-19', nombre: 'Morona Santiago' },
    { id: 'prov-20', nombre: 'Napo' },
    { id: 'prov-21', nombre: 'Orellana' },
    { id: 'prov-22', nombre: 'Pastaza' },
    { id: 'prov-23', nombre: 'Sucumbíos' },
    { id: 'prov-24', nombre: 'Zamora Chinchipe' },
];


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
];