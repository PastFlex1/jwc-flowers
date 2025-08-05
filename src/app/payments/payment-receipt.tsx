
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import type { Payment, Customer, Invoice, BunchItem } from '@/lib/types';

type PaymentReceiptProps = {
  payment: Payment;
  customer: Customer;
  invoice: Invoice;
};

export function PaymentReceipt({ payment, customer, invoice }: PaymentReceiptProps) {
  
  const invoiceTotal = invoice.items.reduce((acc, item) => {
    if (!item.bunches) return acc;
    return acc + item.bunches.reduce((bunchAcc, bunch: BunchItem) => {
      const stems = bunch.stemsPerBunch * bunch.bunches;
      return bunchAcc + (stems * bunch.salePrice);
    }, 0);
  }, 0);

  const saldo = invoiceTotal - payment.amount;

  return (
    <div id="receipt-to-print">
      <Card className="p-4 bg-white text-black shadow-lg border print:shadow-none print:border-0">
        <CardContent className="p-0 text-xs leading-tight">
          <header className="flex justify-between items-start mb-4">
            <div className="w-1/2">
              <h1 className="text-lg font-bold">JCW FLOWERS</h1>
              <p>RUC: 1710568393001</p>
            </div>
            <div className="w-1/2 flex flex-col items-end text-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="JCW Flowers Logo" width={140} height={42} className="mb-2" />
              <p>Fecha de Impresión: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
            </div>
          </header>

          <div className="text-center my-4">
            <h2 className="text-xl font-bold">COMPROBANTE DE INGRESO</h2>
            <p className="text-lg font-semibold">N° {payment.id.substring(0, 15).toUpperCase()}</p>
          </div>

          <section className="border-t border-b border-gray-300 py-2 mb-4 text-[10px]">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <strong>CLIENTE:</strong> <span>{customer?.name}</span>
              <strong>DESCRIPCIÓN:</strong> <span>COBRO DOCUMENTOS DE VENTA</span>
              <strong>FECHA:</strong> <span>{format(parseISO(payment.paymentDate), 'yyyy-MM-dd HH:mm:ss')}</span>
              <strong>COMENTARIO:</strong> <span>{payment.notes}</span>
            </div>
          </section>

          <section className="mb-4">
            <h3 className="font-bold text-sm mb-2">Documentos Relacionados</h3>
            <div className="grid grid-cols-[1.5fr,1.5fr,1fr,1fr,1fr] font-bold text-center bg-gray-100 border-t border-l border-r border-black text-[9px] leading-tight">
              <div className="p-1 border-r border-black">Fecha Emisión</div>
              <div className="p-1 border-r border-black">N° Documento</div>
              <div className="p-1 border-r border-black">TOTAL</div>
              <div className="p-1 border-r border-black">PAGO</div>
              <div className="p-1">SALDO</div>
            </div>
            <div className="border-l border-r border-b border-black grid grid-cols-[1.5fr,1.5fr,1fr,1fr,1fr] text-center text-[10px]">
                <div className="p-1 border-r border-gray-300">{format(parseISO(invoice.flightDate), 'yyyy-MM-dd HH:mm:ss')}</div>
                <div className="p-1 border-r border-gray-300">{invoice.invoiceNumber}</div>
                <div className="p-1 border-r border-gray-300 text-right">${invoiceTotal.toFixed(2)}</div>
                <div className="p-1 border-r border-gray-300 text-right">${payment.amount.toFixed(2)}</div>
                <div className="p-1 text-right font-semibold">${saldo.toFixed(2)}</div>
            </div>
             <div className="grid grid-cols-[1.5fr,1.5fr,1fr,1fr,1fr] font-bold text-center text-xs">
                <div className="p-1 col-span-2 text-right">TOTAL:</div>
                <div className="p-1 text-right">${invoiceTotal.toFixed(2)}</div>
                <div className="p-1 text-right">${payment.amount.toFixed(2)}</div>
                <div className="p-1 text-right">${saldo.toFixed(2)}</div>
            </div>
          </section>
          
           <section>
            <h3 className="font-bold text-sm mb-2">Forma de Pago</h3>
            <div className="grid grid-cols-[30px,1fr,1fr,2fr] font-bold text-center bg-gray-100 border-t border-l border-r border-black text-[9px] leading-tight">
              <div className="p-1 border-r border-black">N°</div>
              <div className="p-1 border-r border-black">FORMA DE PAGO</div>
              <div className="p-1 border-r border-black">VALOR</div>
              <div className="p-1">DETALLE</div>
            </div>
            <div className="border-l border-r border-b border-black grid grid-cols-[30px,1fr,1fr,2fr] text-center text-[10px]">
                <div className="p-1 border-r border-gray-300">1</div>
                <div className="p-1 border-r border-gray-300">{payment.paymentMethod}</div>
                <div className="p-1 border-r border-gray-300 text-right">${payment.amount.toFixed(2)}</div>
                <div className="p-1 text-left">{payment.reference}</div>
            </div>
             <div className="grid grid-cols-[30px,1fr,1fr,2fr] font-bold text-xs">
                <div className="p-1 col-span-2 text-right">TOTAL:</div>
                <div className="p-1 text-right">${payment.amount.toFixed(2)}</div>
                <div className="p-1"></div>
            </div>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
