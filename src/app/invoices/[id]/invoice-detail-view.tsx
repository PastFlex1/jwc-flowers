'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { InvoiceActions } from './invoice-actions';
import type { Invoice, Customer, Consignatario, Carguera, Pais, LineItem } from '@/lib/types';

type InvoiceDetailViewProps = {
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
  carguera: Carguera | null;
  pais: Pais | null;
};

export function InvoiceDetailView({ invoice, customer, consignatario, carguera, pais }: InvoiceDetailViewProps) {
  
  const totals = useMemo(() => {
    let totalBoxes = invoice?.items?.length || 0;
    let totalBunches = 0;
    let totalStems = 0;
    let totalFob = 0;

    invoice?.items?.forEach(item => {
      if (item.bunches && Array.isArray(item.bunches)) {
        item.bunches.forEach(bunch => {
          const bunchesCount = Number(bunch.bunches) || 0;
          const stemsPerBunch = Number(bunch.stemsPerBunch) || 0;
          const salePrice = Number(bunch.salePrice) || 0;

          totalBunches += bunchesCount;
          const stemsInBunch = bunchesCount * stemsPerBunch;
          totalStems += stemsInBunch;
          totalFob += stemsInBunch * salePrice;
        });
      }
    });

    return { totalBoxes, totalBunches, totalStems, totalFob };
  }, [invoice?.items]);


  const renderItemRow = (item: LineItem, index: number) => {
    return (
       <React.Fragment key={item.id || index}>
        {item.bunches.map((bunch, bunchIndex) => {
            const totalPrice = (bunch.stemsPerBunch * bunch.bunches) * bunch.salePrice;
            const stemsPerBox = bunch.stemsPerBunch * bunch.bunches;
            return (
                 <div key={bunch.id || bunchIndex} className="contents text-[10px]">
                    <div className="border-b border-l border-border p-1 text-center">{item.boxNumber}</div>
                    <div className="border-b border-l border-border p-1 text-center">{item.boxType.toUpperCase()}</div>
                    <div className="border-b border-l border-border p-1 text-left">{bunch.product}</div>
                    <div className="border-b border-l border-border p-1 text-left">{bunch.variety}</div>
                    <div className="border-b border-l border-border p-1 text-left">{bunch.color}</div>
                    <div className="border-b border-l border-border p-1 text-center">{bunch.length}</div>
                    <div className="border-b border-l border-border p-1 text-center">{stemsPerBox}</div>
                    <div className="border-b border-l border-border p-1 text-center">{bunch.bunches}</div>
                    <div className="border-b border-l border-border p-1 text-right">{bunch.salePrice.toFixed(3)}</div>
                    <div className="border-b border-r border-l border-border p-1 text-right font-semibold">${totalPrice.toFixed(2)}</div>
                </div>
            )
        })}
       </React.Fragment>
    )
  }

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex justify-end items-center no-print">
          <InvoiceActions
            invoice={invoice}
            customer={customer}
            consignatario={consignatario}
            carguera={carguera}
            pais={pais}
          />
        </div>
        
        <Card className="p-4 bg-white text-black shadow-lg border print:shadow-none print:border-0" id="invoice-to-print">
          <CardContent className="p-0 text-xs leading-tight">
            {/* Header Section */}
            <header className="flex justify-between items-start mb-4">
                <div className="w-1/2">
                    <Image src="/logo.png" alt="JCW Flowers Logo" width={180} height={54} />
                    <div className="border border-gray-300 p-2 text-[10px] mt-2">
                        <p><strong>E-MAIL:</strong> jcwf@outlook.es</p>
                        <p><strong>PHONE:</strong> +593 096 744 1343</p>
                        <p><strong>ADDRESS:</strong> Pasaje F y Calle Quito, EL QUINCHE - QUITO - ECUADOR</p>
                    </div>
                </div>
                <div className="w-1/2 flex flex-col items-end">
                    <h1 className="text-2xl font-bold mb-2 tracking-wider">INVOICE</h1>
                    <div className="w-[250px] text-[10px]">
                        <div className="flex border border-gray-300">
                            <div className="w-1/3 border-r border-gray-300 p-1 font-bold">DATE:</div>
                            <div className="w-2/3 p-1 text-center">{format(parseISO(invoice.flightDate), 'MM/dd/yyyy')}</div>
                        </div>
                        <div className="flex border-l border-r border-b border-gray-300">
                            <div className="w-1/3 border-r border-gray-300 p-1 font-bold">No.</div>
                            <div className="w-2/3 p-1 text-center font-bold text-base">{invoice.invoiceNumber}</div>
                        </div>
                    </div>
                    <div className="w-[250px] text-[10px] mt-2">
                         <div className="flex border border-gray-300">
                            <div className="w-1/3 border-r border-gray-300 p-1 font-bold">AWB:</div>
                            <div className="w-2/3 p-1 text-center">{invoice.masterAWB}</div>
                        </div>
                        <div className="flex border-l border-r border-b border-gray-300">
                            <div className="w-1/3 border-r border-gray-300 p-1 font-bold">HAWB:</div>
                            <div className="w-2/3 p-1 text-center">{invoice.houseAWB}</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Client Info Section */}
            <section className="border border-gray-300 p-2 mb-4 text-[10px]">
                <div className="grid grid-cols-[auto,1fr] gap-x-4">
                    <strong>Name Client:</strong> <span>{customer?.name}</span>
                    <strong>Mark:</strong> <span>{invoice.reference}</span>
                    <strong>Agency:</strong> <span>{carguera?.nombreCarguera}</span>
                    <strong>Address:</strong> <span>{customer?.address}</span>
                    <strong>Country:</strong> <span>{pais?.nombre}</span>
                </div>
            </section>

            {/* Items Table */}
            <section>
                <div className="grid grid-cols-[auto,auto,1.5fr,1.5fr,1fr,auto,auto,auto,auto,auto] font-bold text-center bg-gray-100 border-t border-l border-r border-gray-300 text-[9px] leading-tight">
                    <div className="p-1 border-r border-gray-300">CAJAS</div>
                    <div className="p-1 border-r border-gray-300">TIPO</div>
                    <div className="p-1 border-r border-gray-300 text-left">NOMBRE DE LA FLOR</div>
                    <div className="p-1 border-r border-gray-300 text-left">VARIEDAD</div>
                    <div className="p-1 border-r border-gray-300 text-left">COLOR</div>
                    <div className="p-1 border-r border-gray-300">LONG.</div>
                    <div className="p-1 border-r border-gray-300">TALLOS</div>
                    <div className="p-1 border-r border-gray-300">BUNCHES</div>
                    <div className="p-1 border-r border-gray-300">P. VENTA</div>
                    <div className="p-1">TOTAL</div>
                </div>
                
                <div className="border-l border-r border-b border-gray-300 grid grid-cols-[auto,auto,1.5fr,1.5fr,1fr,auto,auto,auto,auto,auto]">
                    {invoice.items.map((item, index) => renderItemRow(item, index))}
                </div>
                
                 <div className="grid grid-cols-[auto,auto,1.5fr,1.5fr,1fr,auto,auto,auto,auto,auto] font-bold text-center bg-gray-50 border-l border-r border-b border-gray-300 text-xs">
                    <div className="p-1 border-r border-gray-300 text-center">{totals.totalBoxes}</div>
                    <div className="p-1 border-r border-gray-300 col-span-5 text-center">TOTALES</div>
                    <div className="p-1 border-r border-gray-300">{totals.totalStems}</div>
                    <div className="p-1 border-r border-gray-300">{totals.totalBunches}</div>
                    <div className="p-1 border-r border-gray-300"></div> {/* unit price */}
                    <div className="p-1"></div> {/* total price */}
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-4 flex justify-between items-end">
                <p className="text-[8px] max-w-sm">
                    All prices are FOB Quito. Please remember that you have 10 days after the date on the invoice to
                    make a claim and that we do not accept credits for freight or handling charges in any case.
                </p>
                <div className="text-sm">
                    <div className="flex border border-gray-300 w-56">
                         <div className="p-1 font-bold w-1/2 border-r border-gray-300 text-xs">TOTAL FOB</div>
                         <div className="p-1 text-right w-1/2 font-bold">${totals.totalFob.toFixed(2)}</div>
                    </div>
                </div>
            </footer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
