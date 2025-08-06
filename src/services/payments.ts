
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
        return acc + item.bunches.reduce((bunchAcc, bunch: BunchItem) => {
            const stems = bunch.stemsPerBunch * bunch.bunches;
            return bunchAcc + (stems * bunch.salePrice);
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
        newStatus = 'Pending';
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
