export interface Customer {
  id: string;
  name: string;
  email: string;
  billingAddress: string;
  isFirstOrder?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
}

export interface InvoiceItem {
  itemId: string;
  quantity: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface Finca {
  id: string;
  name: string;
  address: string;
  phone: string;
  taxId: string;
  productType: string;
}

export interface Marcacion {
  id: string;
  pais: string;
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
