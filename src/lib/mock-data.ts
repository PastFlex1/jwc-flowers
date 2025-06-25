import { type Customer, type InventoryItem, type Invoice, type Finca, type Marcacion, type Pais, type Provincia, type Dae, type Carguera } from './types';

export const customers: Customer[] = [
  { id: 'cus_1', name: 'Elena Rodriguez', email: 'elena.r@example.com', billingAddress: '123 Meadow Lane, Greenfield, CA 91234', isFirstOrder: true },
  { id: 'cus_2', name: 'Benjamin Carter', email: 'ben.carter@example.com', billingAddress: '456 Oak Avenue, Metropolis, NY 54321' },
  { id: 'cus_3', name: 'Sophia Loren', email: 'sophia.l@example.com', billingAddress: '789 Pine Street, Star City, TX 67890' },
  { id: 'cus_4', name: 'The Wedding Planners Inc.', email: 'contact@weddingplanners.com', billingAddress: '101 Rose Boulevard, Celebration, FL 11223' },
];

export const inventory: InventoryItem[] = [
  { id: 'item_1', name: 'Dozen Red Roses', description: 'A classic bouquet of one dozen long-stemmed red roses.', price: 75.00, cost: 30.00 },
  { id: 'item_2', name: 'White Lily Arrangement', description: 'Elegant white lilies in a modern ceramic vase.', price: 90.00, cost: 40.00 },
  { id: 'item_3', name: 'Sunflower Surprise', description: 'A cheerful bunch of vibrant sunflowers.', price: 55.00, cost: 22.00 },
  { id: 'item_4', name: 'Orchid Plant', description: 'A delicate and long-lasting Phalaenopsis orchid.', price: 65.00, cost: 25.00 },
  { id: 'item_5', name: 'Glass Vase - Large', description: 'A tall, clear glass vase for large arrangements.', price: 25.00, cost: 10.00 },
  { id: 'item_6', name: 'Custom Bouquet Service', description: 'Consultation and creation of a custom floral arrangement.', price: 150.00, cost: 60.00 },
];

export const invoices: Invoice[] = [
  {
    id: 'inv_1',
    invoiceNumber: '2024-001',
    customerId: 'cus_1',
    issueDate: '2024-07-15',
    dueDate: '2024-08-14',
    items: [{ itemId: 'item_1', quantity: 1 }],
    status: 'Paid',
  },
  {
    id: 'inv_2',
    invoiceNumber: '2024-002',
    customerId: 'cus_2',
    issueDate: '2024-07-20',
    dueDate: '2024-08-19',
    items: [{ itemId: 'item_2', quantity: 1 }, { itemId: 'item_5', quantity: 1 }],
    status: 'Pending',
  },
  {
    id: 'inv_3',
    invoiceNumber: '2024-003',
    customerId: 'cus_3',
    issueDate: '2024-06-10',
    dueDate: '2024-07-09',
    items: [{ itemId: 'item_3', quantity: 2 }],
    status: 'Overdue',
  },
];

export const fincas: Finca[] = [
  { id: 'finca_1', name: 'Finca Rosaleda', address: 'Valle de las Flores, Cayambe', phone: '0991234567', taxId: '1791234567001', productType: 'Rosas' },
  { id: 'finca_2', name: 'Girasoles del Sol', address: 'Ruta del Sol, km 25', phone: '0987654321', taxId: '1798765432001', productType: 'Girasoles' },
];

export const marcaciones: Marcacion[] = [
  { id: 'mar_1', numeroMarcacion: 'MARC-001', cliente: 'Elena Rodriguez' },
  { id: 'mar_2', numeroMarcacion: 'MARC-002', cliente: 'Benjamin Carter' },
];

export const paises: Pais[] = [
  { id: 'pais_1', nombre: 'Ecuador' },
  { id: 'pais_2', nombre: 'Colombia' },
  { id: 'pais_3', nombre: 'Perú' },
];

export const provincias: Provincia[] = [
  { id: 'prov_1', nombre: 'Pichincha' },
  { id: 'prov_2', nombre: 'Guayas' },
];

export const daes: Dae[] = [
  { id: 'dae_1', pais: 'Ecuador', numeroDae: 'DAE-EC-001' },
  { id: 'dae_2', pais: 'Colombia', numeroDae: 'DAE-CO-002' },
];

export const cargueras: Carguera[] = [
    { id: 'car_1', nombreCarguera: 'ALIANZA LOGISTIC/G&G', pais: 'Ecuador' },
    { id: 'car_2', nombreCarguera: 'CARGO MASTER/DSV/PANALPINA', pais: 'Ecuador' },
    { id: 'car_3', nombreCarguera: 'CEVA CARGO/CIMA CARGO', pais: 'Ecuador' },
    { id: 'car_4', nombreCarguera: 'CHAMPION AIR CARGO', pais: 'Ecuador' },
    { id: 'car_5', nombreCarguera: 'D Y CARGO', pais: 'Ecuador' },
    { id: 'car_6', nombreCarguera: 'DIRECT CARGO', pais: 'Ecuador' },
    { id: 'car_7', nombreCarguera: 'EBF CARGO', pais: 'Ecuador' },
    { id: 'car_8', nombreCarguera: 'ECUADOR CARGO', pais: 'Ecuador' },
    { id: 'car_9', nombreCarguera: 'FLORAL TECH-LOGIKE CARGO', pais: 'Ecuador' },
    { id: 'car_10', nombreCarguera: 'FLOWER CARGO', pais: 'Ecuador' },
    { id: 'car_11', nombreCarguera: 'FRESH LINK', pais: 'Ecuador' },
    { id: 'car_12', nombreCarguera: 'FRESH LOGISTIK', pais: 'Ecuador' },
    { id: 'car_13', nombreCarguera: 'GREEN LOGISTIC', pais: 'Ecuador' },
    { id: 'car_14', nombreCarguera: 'HP APOLLO', pais: 'Ecuador' },
    { id: 'car_15', nombreCarguera: 'KHUENE NAGEL', pais: 'Ecuador' },
    { id: 'car_16', nombreCarguera: 'LOGISTI USA/PANATLANTIC', pais: 'Ecuador' },
    { id: 'car_17', nombreCarguera: 'ONE TEAM CARGO', pais: 'Ecuador' },
    { id: 'car_18', nombreCarguera: 'OPERFLOR', pais: 'Ecuador' },
    { id: 'car_19', nombreCarguera: 'PACIFIC AIR CARGO', pais: 'Ecuador' },
    { id: 'car_20', nombreCarguera: 'PG CARGO', pais: 'Ecuador' },
    { id: 'car_21', nombreCarguera: 'SAFTEC', pais: 'Ecuador' },
    { id: 'car_22', nombreCarguera: 'UPS SAFTEC', pais: 'Ecuador' },
    { id: 'car_23', nombreCarguera: 'SIERRA CARGO', pais: 'Ecuador' },
    { id: 'car_24', nombreCarguera: 'VALUE CARGO', pais: 'Ecuador' },
    { id: 'car_25', nombreCarguera: 'WORLD WIDE', pais: 'Ecuador' },
];
