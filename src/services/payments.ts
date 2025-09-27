// This service is now mocked for the demo version.
// It no longer interacts with a database.
import type { Payment, Invoice, CreditNote, DebitNote, BunchItem } from '@/lib/types';
import { payments as mockPayments } from '@/lib/mock-data';
import { getInvoices, updateInvoice } from './invoices';
import { getCreditNotes } from './credit-notes';
import { getDebitNotes } from './debit-notes';


let payments = [...mockPayments];

export async function getPayments(): Promise<Payment[]> {
  return Promise.resolve(payments);
}

export async function getPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
  const invoicePayments = payments.filter(p => p.invoiceId === invoiceId);
  return Promise.resolve(invoicePayments);
}

async function updateInvoiceStatus(invoiceId: string, type: 'sale' | 'purchase' | 'both', flightDate: string) {
    const allInvoices = await getInvoices();
    const invoice = allInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    const subtotal = invoice.items.reduce((acc, item) => {
        if (!item.bunches) return acc;
        const priceField = type === 'purchase' ? 'purchasePrice' : 'salePrice';
        return acc + item.bunches.reduce((bunchAcc, bunch: BunchItem) => {
            const stems = bunch.stemsPerBunch * bunch.bunchesPerBox;
            return bunchAcc + (stems * bunch[priceField]);
        }, 0);
    }, 0);

    const allCreditNotes = await getCreditNotes();
    const allDebitNotes = await getDebitNotes();
    const allPayments = await getPayments();

    const totalCreditAmount = allCreditNotes.filter(cn => cn.invoiceId === invoiceId).reduce((sum, doc) => sum + doc.amount, 0);
    const totalDebitAmount = allDebitNotes.filter(dn => dn.invoiceId === invoiceId).reduce((sum, doc) => sum + doc.amount, 0);
    const totalPaidAmount = allPayments.filter(p => p.invoiceId === invoiceId).reduce((sum, doc) => sum + doc.amount, 0);
    
    const totalCharge = subtotal - totalCreditAmount + totalDebitAmount;
    const newBalance = totalCharge - totalPaidAmount;
    
    let newStatus: 'Paid' | 'Pending' | 'Overdue';
    if (newBalance <= 0.01) {
        newStatus = 'Paid';
    } else {
        const dueDate = new Date(flightDate);
        dueDate.setDate(dueDate.getDate() + 30);
        newStatus = new Date() > dueDate ? 'Overdue' : 'Pending';
    }
    
    await updateInvoice(invoiceId, { status: newStatus });
    console.log(`Mock: Invoice ${invoiceId} status updated to ${newStatus}`);
}

export async function addBulkPayment(
  paymentData: Omit<Payment, 'id' | 'invoiceId' | 'amount'>, 
  invoiceBalances: { invoiceId: string; balance: number; type: 'sale' | 'purchase' | 'both', flightDate: string }[],
  totalAmountToApply: number
): Promise<void> {
  let remainingAmount = totalAmountToApply;

  for (const { invoiceId, balance, type, flightDate } of invoiceBalances) {
    if (remainingAmount <= 0) break;

    const paymentAmountForInvoice = Math.min(remainingAmount, balance);
    
    const newId = `payment-${Date.now()}-${Math.random()}`;
    const newPayment: Payment = {
      id: newId,
      ...paymentData,
      invoiceId: invoiceId,
      amount: paymentAmountForInvoice,
    };
    payments.push(newPayment);
    console.log("Mock addPayment (bulk):", newPayment);

    await updateInvoiceStatus(invoiceId, type, flightDate);

    remainingAmount -= paymentAmountForInvoice;
  }
  
  if (remainingAmount > 0.01) {
    console.warn(`Payment amount of ${totalAmountToApply} exceeded the total balance of selected invoices. $${remainingAmount.toFixed(2)} was not applied.`);
  }

  return Promise.resolve();
}
