import { db } from '@/lib/firebase';
import type { Payment, Invoice, CreditNote, DebitNote } from '@/lib/types';
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

    // 1. Calculate total charge on invoice
    const subtotal = invoiceData.items.reduce((total, item) => {
        const totalStems = (item.stemCount || 0) * (item.bunchesPerBox || 0);
        return total + ((item.salePrice || 0) * totalStems);
    }, 0);
    const tax = subtotal * 0.12; 
    let totalCharge = subtotal + tax;

    // 2. Fetch and subtract credit notes
    const creditNotesRef = collection(db, 'creditNotes');
    const creditQuery = query(creditNotesRef, where("invoiceId", "==", paymentData.invoiceId));
    const creditNotesSnapshot = await getDocs(creditQuery);
    const totalCreditAmount = creditNotesSnapshot.docs.reduce((sum, doc) => sum + (doc.data() as CreditNote).amount, 0);

    // 3. Fetch and add debit notes
    const debitNotesRef = collection(db, 'debitNotes');
    const debitQuery = query(debitNotesRef, where("invoiceId", "==", paymentData.invoiceId));
    const debitNotesSnapshot = await getDocs(debitQuery);
    const totalDebitAmount = debitNotesSnapshot.docs.reduce((sum, doc) => sum + (doc.data() as DebitNote).amount, 0);

    totalCharge = totalCharge - totalCreditAmount + totalDebitAmount;


    // 4. Fetch existing payments
    const paymentsRef = collection(db, 'payments');
    const paymentQuery = query(paymentsRef, where("invoiceId", "==", paymentData.invoiceId));
    const paymentsSnapshot = await getDocs(paymentQuery);
    const totalPaidAmount = paymentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data() as Payment).amount, 0);
    
    // 5. Calculate new balance and determine new status
    const newTotalPaid = totalPaidAmount + paymentData.amount;
    const newBalance = totalCharge - newTotalPaid;
    
    let newStatus: 'Paid' | 'Pending' | 'Overdue' = invoiceData.status;
    if (newBalance <= 0) {
        newStatus = 'Paid';
    }

    // 6. Add the new payment
    const newPaymentRef = doc(collection(db, 'payments'));
    const newPaymentData = {
        ...paymentData,
        paymentDate: new Date(paymentData.paymentDate),
    };
    transaction.set(newPaymentRef, newPaymentData);
    paymentId = newPaymentRef.id;

    // 7. Update the invoice status
    transaction.update(invoiceRef, { status: newStatus });
   });

   if (!paymentId) {
     throw new Error("Failed to create payment document.");
   }

   return paymentId;
}
