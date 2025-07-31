'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import type { StatementData } from './account-statement-client';

type AccountStatementViewProps = {
  data: StatementData;
};

export function AccountStatementView({ data }: AccountStatementViewProps) {

  const groupedInvoices = data.invoices.reduce((acc, invoice) => {
    const month = format(parseISO(invoice.flightDate), 'MMMM yyyy');
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(invoice);
    return acc;
  }, {} as Record<string, typeof data.invoices>);

  return (
    <Card className="p-6 bg-white text-black shadow-lg border print:shadow-none print:border-0" id="statement-to-print">
      <CardContent className="p-0 text-sm leading-tight">
        <header className="flex justify-between items-start mb-6">
          <div className="w-1/2">
            <Image src="/logo.png" alt="JCW Flowers Logo" width={200} height={60} className="mb-4" />
            <div className="text-xs">
              <p>El Quinche, Pasaje F y Calle Quito</p>
              <p>Quito</p>
              <p>Ecuador</p>
              <p><strong>E-mail:</strong> jcwf@outlook.es</p>
              <p><strong>Phone:</strong> 096 744 1343</p>
            </div>
          </div>
          <div className="w-1/2 flex flex-col items-end">
            <h1 className="text-xl font-bold mb-4 tracking-wider">STATEMENT ACCOUNT {data.customer.name.toUpperCase()}</h1>
            <div className="w-[280px] text-xs mt-4">
              <div className="flex border border-gray-300 bg-gray-100 font-bold">
                <div className="w-2/3 p-1">ACCOUNT BALANCE:</div>
                <div className="w-1/3 p-1 text-center">{format(new Date(), 'dd/MM/yyyy')}</div>
              </div>
              <div className="flex border-l border-r border-b border-gray-300">
                <div className="w-2/3 p-1"></div>
                <div className="w-1/3 p-1 text-right font-bold">${data.totalOutstanding.toFixed(2)}</div>
              </div>
            </div>
             <div className="w-[280px] text-xs mt-2">
              <div className="flex border border-gray-300 bg-gray-100 font-bold">
                <div className="w-2/3 p-1">INVOICES URGENT PAYMENT:</div>
                <div className="w-1/3 p-1 text-center">{format(new Date(), 'dd/MM/yyyy')}</div>
              </div>
              <div className="flex border-l border-r border-b border-gray-300">
                <div className="w-2/3 p-1"></div>
                <div className="w-1/3 p-1 text-right font-bold">${data.urgentPayment.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </header>

        <section className="border border-black p-2 mb-4 text-xs">
          <div className="grid grid-cols-[auto,1fr] gap-x-2">
            <strong>BILLING CLIENT:</strong>
            <span className="font-bold">{data.customer.name.toUpperCase()}</span>
            <strong>ADDRESS:</strong>
            <span>{data.customer.address}</span>
            <strong>CITY:</strong>
            <span>{data.customer.estadoCiudad}, {data.customer.pais}</span>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-[100px,100px,1fr,100px,100px,100px,100px] font-bold text-center bg-gray-200 border-t border-l border-r border-black text-xs">
            <div className="p-1 border-r border-black">DATE</div>
            <div className="p-1 border-r border-black">INVOICE #</div>
            <div className="p-1 border-r border-black">CUSTOMER</div>
            <div className="p-1 border-r border-black">CHARGES</div>
            <div className="p-1 border-r border-black">CREDITS/DEBITS</div>
            <div className="p-1 border-r border-black">PAYMENTS</div>
            <div className="p-1">BALANCE</div>
          </div>
          <div className="border-l border-r border-b border-black text-xs">
            {Object.entries(groupedInvoices).map(([month, invoices]) => (
              <React.Fragment key={month}>
                <div className="grid grid-cols-[100px,100px,1fr,100px,100px,100px,100px] bg-gray-100 font-bold">
                  <div className="p-1 border-b border-black col-span-7">OUTSTANDING {month.toUpperCase()}</div>
                </div>
                {invoices.map(invoice => (
                   <div key={invoice.id} className="grid grid-cols-[100px,100px,1fr,100px,100px,100px,100px] border-b border-gray-300">
                    <div className="p-1 text-center">{format(parseISO(invoice.flightDate), 'dd/MM/yyyy')}</div>
                    <div className="p-1 text-center">{invoice.invoiceNumber}</div>
                    <div className="p-1">{data.customer.name}</div>
                    <div className="p-1 text-right">${invoice.total.toFixed(2)}</div>
                    <div className="p-1 text-right">${(invoice.credits - invoice.debits).toFixed(2)}</div>
                    <div className="p-1 text-right">${invoice.payments.toFixed(2)}</div>
                    <div className="p-1 text-right font-semibold">${invoice.balance.toFixed(2)}</div>
                   </div>
                ))}
              </React.Fragment>
            ))}
          </div>

           <div className="grid grid-cols-[100px,100px,1fr,100px,100px,100px,100px] font-bold text-xs bg-gray-200 border-b border-l border-r border-black">
              <div className="p-1 border-r border-black col-span-3 text-center">TOTAL OUTSTANDING</div>
              <div className="p-1 border-r border-black text-right">${data.invoices.reduce((acc, inv) => acc + inv.total, 0).toFixed(2)}</div>
              <div className="p-1 border-r border-black text-right">${(data.totalCredits - data.totalDebits).toFixed(2)}</div>
              <div className="p-1 border-r border-black text-right">${data.totalPayments.toFixed(2)}</div>
              <div className="p-1 text-right">${data.totalOutstanding.toFixed(2)}</div>
            </div>
        </section>

        <footer className="mt-6 text-xs">
          <h4 className="font-bold text-center mb-2">CREDIT POLICY</h4>
          <div className="border border-black p-2 space-y-1">
            <p>By working with <strong>JCW FLOWERS</strong>, the client accept comply with the following credit policy rules.</p>
            <p>1. Send all the information on time; a customer has <strong>maximum 8 days</strong> to send the information since the farm delivered the boxes in the cargo agency.</p>
            <p>2. Pictures: of the flowers, buches, label, boxes,etc. Invoice Number, Shipping Day, AWB number, Arrive date in the final destination, Picture of UPC code</p>
            <p>3. In case we approved a credit, it will be only for the cost of the flowers, we don't accept any cost of transport or any other charge.</p>
            <p><strong>NOTE. If a customer does not send all the above information, JCW FLOWERS</strong> could not process the credits, and the credit will be refuse.</p>
          </div>
        </footer>
      </CardContent>
    </Card>
  );
}
