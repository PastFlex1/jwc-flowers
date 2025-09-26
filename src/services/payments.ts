import { db } from '@/lib/firebase';
import type { Payment, Invoice, CreditNote, DebitNote, BunchItem } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  runTransaction,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  Timestamp,
  getDoc,
  writeBatch,
} from 'firebase/firestore';

const paymentFromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): Payment => {
  const data = snapshot.data();
  if (!data) throw new Error("Document data not found");
  
  const paymentDate = data.paymentDate instanceof Timestamp 
    ? data.paymentDate.toDate().toISOString() 
    : data.paymentDate;

  return {
    id: snapshot.id,
    invoiceId: data.invoiceId,
    amount: data.amount,
    paymentDate: paymentDate,
    paymentMethod: data.paymentMethod,
    reference: data.reference,
    notes: data.notes,
  };
};

export async function getPayments(): Promise<Payment[]> {
  if (!db) return [];
  const paymentsCollection = collection(db, 'payments');
  const snapshot = await getDocs(paymentsCollection);
  return snapshot.docs.map(paymentFromFirestore);
}

export async function getPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
  if (!db) return [];
  const paymentsCollection = collection(db, 'payments');
  const q = query(paymentsCollection, where("invoiceId", "==", invoiceId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(paymentFromFirestore);
}

export async function addPayment(paymentData: Omit<Payment, 'id'>): Promise<string> {
   if (!db) throw new Error("Firebase is not configured. Check your .env file.");

   let paymentId = '';

   await runTransaction(db, async (transaction) => {
    const invoiceRef = doc(db, 'invoices', paymentData.invoiceId);
    const invoiceDoc = await transaction.get(invoiceRef);

    if (!invoiceDoc.exists()) {
        throw new Error("Invoice does not exist!");
    }

    const invoiceData = invoiceDoc.data() as Omit<Invoice, 'id'>;

    const subtotal = invoiceData.items.reduce((acc, item) => {
      if (!item.bunches) return acc;
      const priceField = invoiceData.type === 'purchase' ? 'purchasePrice' : 'salePrice';
      return acc + item.bunches.reduce((bunchAcc, bunch: BunchItem) => {
        const stems = bunch.stemsPerBunch * bunch.bunchesPerBox;
        return bunchAcc + (stems * bunch[priceField]);
      }, 0);
    }, 0);


    const creditNotesRef = collection(db, 'creditNotes');
    const creditQuery = query(creditNotesRef, where("invoiceId", "==", paymentData.invoiceId));
    const creditNotesSnapshot = await getDocs(creditQuery);
    const totalCreditAmount = creditNotesSnapshot.docs.reduce((sum, doc) => sum + (doc.data() as CreditNote).amount, 0);

    const debitNotesRef = collection(db, 'debitNotes');
    const debitQuery = query(debitNotesRef, where("invoiceId", "==", paymentData.invoiceId));
    const debitNotesSnapshot = await getDocs(debitQuery);
    const totalDebitAmount = debitNotesSnapshot.docs.reduce((sum, doc) => sum + (doc.data() as DebitNote).amount, 0);

    let totalCharge = subtotal - totalCreditAmount + totalDebitAmount;


    const paymentsRef = collection(db, 'payments');
    const paymentQuery = query(paymentsRef, where("invoiceId", "==", paymentData.invoiceId));
    const paymentsSnapshot = await getDocs(paymentQuery);
    const totalPaidAmount = paymentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data() as Payment).amount, 0);
    
    const newTotalPaid = totalPaidAmount + paymentData.amount;
    const newBalance = totalCharge - newTotalPaid;
    
    let newStatus: 'Paid' | 'Pending' | 'Overdue';
    if (newBalance <= 0.01) {
        newStatus = 'Paid';
    } else {
        const dueDate = new Date(invoiceData.flightDate);
        dueDate.setDate(dueDate.getDate() + 30);
        newStatus = new Date() > dueDate ? 'Overdue' : 'Pending';
    }

    const newPaymentRef = doc(collection(db, 'payments'));
    const newPaymentData = {
        ...paymentData,
        paymentDate: new Date(paymentData.paymentDate),
    };
    transaction.set(newPaymentRef, newPaymentData);
    paymentId = newPaymentRef.id;

    transaction.update(invoiceRef, { status: newStatus });
   });

   if (!paymentId) {
     throw new Error("Failed to create payment document.");
   }

   return paymentId;
}

export async function addBulkPayment(
  paymentData: Omit<Payment, 'id' | 'invoiceId' | 'amount'>, 
  invoiceBalances: { invoiceId: string; balance: number; type: 'sale' | 'purchase' | 'both', flightDate: string }[],
  totalAmountToApply: number
): Promise<void> {
  if (!db) throw new Error("Firebase is not configured. Check your .env file.");

  const batch = writeBatch(db);
  let remainingAmount = totalAmountToApply;

  for (const { invoiceId, balance, type, flightDate } of invoiceBalances) {
    if (remainingAmount <= 0) break;

    const paymentAmountForInvoice = Math.min(remainingAmount, balance);
    
    const newPaymentRef = doc(collection(db, 'payments'));
    const newPaymentData = {
      ...paymentData,
      invoiceId: invoiceId,
      amount: paymentAmountForInvoice,
      paymentDate: new Date(paymentData.paymentDate),
    };
    batch.set(newPaymentRef, newPaymentData);

    const newBalance = balance - paymentAmountForInvoice;
    let newStatus: 'Paid' | 'Pending' | 'Overdue';
    if (newBalance <= 0.01) {
        newStatus = 'Paid';
    } else {
       const dueDate = new Date(flightDate);
       dueDate.setDate(dueDate.getDate() + 30);
       newStatus = new Date() > dueDate ? 'Overdue' : 'Pending';
    }

    const invoiceRef = doc(db, 'invoices', invoiceId);
    batch.update(invoiceRef, { status: newStatus });

    remainingAmount -= paymentAmountForInvoice;
  }
  
  if (remainingAmount > 0.01) {
    // This could happen if the total amount is greater than the sum of balances.
    // The current logic simply stops. You could add handling for this case,
    // e.g., creating a credit for the customer, but for now we'll just log it.
    console.warn(`Payment amount of ${totalAmountToApply} exceeded the total balance of selected invoices. $${remainingAmount.toFixed(2)} was not applied.`);
  }

  await batch.commit();
}
