

export interface Customer {
  id: string;
  name: string;
  cedula: string;
  pais: string;
  estadoCiudad: string;
  address: string;
  email: string;
  phone: string;
  agencia: string;
  vendedor: string;
  plazo: number;
  cupo: number;
  daeId?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
}

export interface LineItem {
  id?: string;
  isSubItem?: boolean;
  parentIndex?: number;
  boxType: 'qb' | 'eb' | 'hb';
  boxCount: number;
  boxNumber?: number;
  bunchesPerBox: number;
  product: string;
  variety: string;
  length: number;
  stemCount: number;
  purchasePrice: number;
  salePrice: number;
}


export interface Invoice {
  id: string;
  invoiceNumber: string;
  farmDepartureDate: string;
  flightDate: string;
  sellerId: string;
  customerId: string;
  consignatarioId?: string;
  farmId: string;
  carrierId: string;
  countryId: string;
  reference?: string;
  masterAWB: string;
  houseAWB: string;
  items: LineItem[];
  status: 'Paid' | 'Pending' | 'Overdue';
}


export interface Finca {
  id:string;
  name: string;
  address: string;
  phone: string;
  taxId: string;
  productType: string;
}

export interface Vendedor {
  id: string;
  nombre: string;
  siglas: string;
}

export interface Marcacion {
  id: string;
  numeroMarcacion: string;
  cliente: string;
}

export interface Pais {
  id: string;
  nombre: string;
}

export interface Provincia {
  id: string;
  nombre: string;
}

export interface Dae {
  id: string;
  pais: string;
  numeroDae: string;
}

export interface Carguera {
  id: string;
  nombreCarguera: string;
  pais: string;
}

export interface Consignatario {
  id: string;
  nombreConsignatario: string;
  pais: string;
  customerId: string;
  direccion: string;
  provincia: string;
}

export interface Producto {
  id: string;
  nombre: string;
  tipo: string;
  variedad: string;
}

export interface CreditNote {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  reason: string;
  date: string; // ISO string
}

export interface DebitNote {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  reason: string;
  date: string; // ISO string
}
