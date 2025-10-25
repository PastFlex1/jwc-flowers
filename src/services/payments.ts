// This service is a wrapper around the AppData context.
// It is used to abstract the data source from the components.
// All data logic is handled within the AppDataProvider.

import { useAppData } from '@/context/app-data-context';
import type { Payment } from '@/lib/types';

export function addBulkPayment(
  paymentData: Omit<Payment, 'id' | 'invoiceId' | 'amount'>, 
  invoiceBalances: { invoiceId: string; balance: number }[],
  totalAmountToApply: number
) {
  return useAppData().addBulkPayment(paymentData, invoiceBalances, totalAmountToApply);
}
