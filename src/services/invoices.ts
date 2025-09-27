// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Invoice, Customer, Consignatario, Carguera, Pais } from '@/lib/types';
import { invoices as mockInvoices } from '@/lib/mock-data';
import { getCustomerById } from './customers';
import { getConsignatarioById } from './consignatarios';
import { getCargueraById } from './cargueras';
import { getPaisById } from './paises';

let invoices = [...mockInvoices];

export async function getInvoices(): Promise<Invoice[]> {
  return Promise.resolve(invoices);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const invoice = invoices.find(inv => inv.id === id);
  return Promise.resolve(invoice || null);
}

type InvoiceWithDetails = {
    invoice: Invoice;
    customer: Customer | null;
    consignatario: Consignatario | null;
    carguera: Carguera | null;
    pais: Pais | null;
}

export async function getInvoiceWithDetails(id: string): Promise<InvoiceWithDetails | null> {
    const invoice = await getInvoiceById(id);
    if (!invoice) return null;

    const [customer, consignatario, carguera, pais] = await Promise.all([
        getCustomerById(invoice.customerId),
        invoice.consignatarioId ? getConsignatarioById(invoice.consignatarioId) : null,
        invoice.carrierId ? getCargueraById(invoice.carrierId) : null,
        invoice.countryId ? getPaisById(invoice.countryId) : null
    ]);

    return { invoice, customer, consignatario, carguera, pais };
}

export async function addInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<string> {
  const newId = `invoice-${Date.now()}`;
  const newInvoice: Invoice = { id: newId, ...invoiceData };
  invoices.unshift(newInvoice); // Add to the beginning of the array
  console.log("Mock addInvoice:", newInvoice);
  return Promise.resolve(newId);
}

export async function updateInvoice(id: string, invoiceData: Partial<Omit<Invoice, 'id'>>): Promise<void> {
  invoices = invoices.map(inv => inv.id === id ? { ...inv, ...invoiceData } as Invoice : inv);
  console.log("Mock updateInvoice:", id, invoiceData);
  return Promise.resolve();
}

export async function deleteInvoice(id: string): Promise<void> {
  invoices = invoices.filter(inv => inv.id !== id);
  console.log("Mock deleteInvoice:", id);
  return Promise.resolve();
}
