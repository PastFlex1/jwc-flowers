import type { Payment, BunchItem } from '@/lib/types';
import { readDb, writeDb } from '@/lib/db-actions';
import { updateInvoice } from './invoices';

async function updateInvoiceStatus(invoiceId: string, type: 'sale' | 'purchase' | 'both', flightDate: string) {
    const db = await readDb();
    const invoice = db.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    const subtotal = invoice.items.reduce((acc, item) => {
        if (!item.bunches) return acc;
        const priceField = type === 'purchase' ? 'purchasePrice' : 'salePrice';
        return acc + item.bunches.reduce((bunchAcc, bunch: BunchItem) => {
            const stems = bunch.stemsPerBunch * bunch.bunchesPerBox;
            return bunchAcc + (stems * bunch[priceField]);
        }, 0);
    }, 0);

    const totalCreditAmount = db.creditNotes.filter(cn => cn.invoiceId === invoiceId).reduce((sum, doc) => sum + doc.amount, 0);
    const totalDebitAmount = db.debitNotes.filter(dn => dn.invoiceId === invoiceId).reduce((sum, doc) => sum + doc.amount, 0);
    const totalPaidAmount = db.payments.filter(p => p.invoiceId === invoiceId).reduce((sum, doc) => sum + doc.amount, 0);
    
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
    
    // Update invoice status in the local db object before writing
    const invoiceIndex = db.invoices.findIndex(inv => inv.id === invoiceId);
    if (invoiceIndex > -1) {
      db.invoices[invoiceIndex].status = newStatus;
    }
}

export async function addBulkPayment(
  paymentData: Omit<Payment, 'id' | 'invoiceId' | 'amount'>, 
  invoiceBalances: { invoiceId: string; balance: number; type: 'sale' | 'purchase' | 'both', flightDate: string }[],
  totalAmountToApply: number
): Promise<void> {
  const db = await readDb();
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
    db.payments.push(newPayment);

    // This updates the status in the db object we're holding.
    await updateInvoiceStatus(invoiceId, type, flightDate);

    remainingAmount -= paymentAmountForInvoice;
  }
  
  if (remainingAmount > 0.01) {
    console.warn(`Payment amount of ${totalAmountToApply} exceeded the total balance of selected invoices. $${remainingAmount.toFixed(2)} was not applied.`);
  }

  // Write all changes to the file at once.
  await writeDb(db);
}
