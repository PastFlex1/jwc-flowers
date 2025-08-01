'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { InvoiceActions } from './invoice-actions';
import type { Invoice, Customer, Consignatario, Carguera, Pais, LineItem, BunchItem } from '@/lib/types';

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
        <div className="contents text-xs font-semibold bg-gray-50">
          <div className="border-b border-l border-border p-1 text-center">{item.boxNumber}</div>
          <div className="border-b border-l border-border p-1 text-center col-span-2">{item.boxType.toUpperCase()}</div>
          <div className="border-b border-l border-r border-border p-1 text-left col-span-10"></div>
        </div>
        {item.bunches && item.bunches.map((bunch, bunchIndex) => {
            const totalPrice = (bunch.bunches * bunch.stemsPerBunch) * bunch.salePrice;
            return (
                 <div key={bunch.id || bunchIndex} className="contents text-xs">
                    <div className="border-b border-l border-border p-1 text-center col-span-3"></div>
                    <div className="border-b border-l border-border p-1 text-left">{bunch.product}</div>
                    <div className="border-b border-l border-border p-1 text-left">{bunch.variety}</div>
                    <div className="border-b border-l border-border p-1 text-center">{bunch.length}</div>
                    <div className="border-b border-l border-border p-1 text-center">{bunch.stemsPerBunch}</div>
                    <div className="border-b border-l border-border p-1 text-center">{bunch.bunches}</div>
                    <div className="border-b border-l border-border p-1 text-center">{(bunch.stemsPerBunch * bunch.bunches)}</div>
                    <div className="border-b border-l border-border p-1 text-right">0.00</div>
                    <div className="border-b border-l border-border p-1 text-right">0.00</div>
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
          <InvoiceActions invoice={invoice} customer={customer} />
        </div>
        
        <Card className="p-6 bg-white text-black shadow-lg border print:shadow-none print:border-0" id="invoice-to-print">
          <CardContent className="p-0 text-sm leading-tight">
            {/* Header Section */}
            <header className="flex justify-between items-start mb-6">
                <div className="w-1/2">
                    <Image src="/logo.png" alt="JCW Flowers Logo" width={200} height={60} />
                    <div className="border border-gray-300 p-2 text-xs mt-2">
                        <p><strong>E-MAIL:</strong> jcwf@outlook.es</p>
                        <p><strong>PHONE:</strong> +593 096 744 1343</p>
                        <p><strong>ADDRESS:</strong> Pasaje F y Calle Quito, EL QUINCHE - QUITO - ECUADOR</p>
                    </div>
                </div>
                <div className="w-1/2 flex flex-col items-end">
                    <h1 className="text-3xl font-bold mb-4 tracking-wider">INVOICE</h1>
                    <div className="w-[280px] text-xs">
                        <div className="flex border border-gray-300">
                            <div className="w-1/3 border-r border-gray-300 p-1 font-bold">DATE:</div>
                            <div className="w-2/3 p-1 text-center">{format(parseISO(invoice.flightDate), 'MM/dd/yyyy')}</div>
                        </div>
                        <div className="flex border-l border-r border-b border-gray-300">
                            <div className="w-1/3 border-r border-gray-300 p-1 font-bold">No.</div>
                            <div className="w-2/3 p-1 text-center font-bold text-base">{invoice.invoiceNumber}</div>
                        </div>
                    </div>
                    <div className="w-[280px] text-xs mt-4">
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
            <section className="border border-gray-300 p-2 mb-6 text-xs">
                <div className="grid grid-cols-[auto,1fr] gap-x-4">
                    <strong>Name Client:</strong> <span>{customer?.name}</span>
                    <strong>Mark:</strong> <span>{invoice.reference}</span>
                    <strong>Agency:</strong> <span>{carguera?.nombreCarguera}</span>
                    <strong>Address:</strong> <span>{consignatario?.direccion}</span>
                    <strong>Country:</strong> <span>{pais?.nombre}</span>
                </div>
            </section>

            {/* Items Table */}
            <section>
                <div className="grid grid-cols-[30px,40px,50px,1fr,1fr,40px,60px,60px,60px,60px,60px,60px,70px] font-bold text-center bg-gray-100 border-t border-l border-r border-gray-300 text-[10px] leading-tight">
                    <div className="p-1 border-r border-gray-300">CODE</div>
                    <div className="p-1 border-r border-gray-300">BOXES</div>
                    <div className="p-1 border-r border-gray-300">BOX TYPE</div>
                    <div className="p-1 border-r border-gray-300 text-left">PRODUCT</div>
                    <div className="p-1 border-r border-gray-300 text-left">VARIETY</div>
                    <div className="p-1 border-r border-gray-300">LENGTH</div>
                    <div className="p-1 border-r border-gray-300">STEMS BY BUNCH</div>
                    <div className="p-1 border-r border-gray-300">BUNCH BY BOX</div>
                    <div className="p-1 border-r border-gray-300">STEMS BY BOX</div>
                    <div className="p-1 border-r border-gray-300">N.W.</div>
                    <div className="p-1 border-r border-gray-300">G.W.</div>
                    <div className="p-1 border-r border-gray-300">UNIT PRICE</div>
                    <div className="p-1">TOTAL PRICE</div>
                </div>
                
                <div className="border-l border-r border-b border-gray-300 grid grid-cols-[30px,40px,50px,1fr,1fr,40px,60px,60px,60px,60px,60px,60px,70px]">
                    {invoice.items.map((item, index) => renderItemRow(item, index))}
                </div>
                
                <div className="grid grid-cols-[30px,40px,50px,1fr,1fr,40px,60px,60px,60px,60px,60px,60px,70px] font-bold text-center bg-gray-50 border-l border-r border-b border-gray-300 text-xs">
                    <div className="p-1 border-r border-gray-300 text-center">{totals.totalBoxes}</div>
                    <div className="p-1 border-r border-gray-300 col-span-4 text-center">TOTALES</div>
                    <div className="p-1 border-r border-gray-300"></div> {/* length */}
                    <div className="p-1 border-r border-gray-300"></div> {/* stems/bunch */}
                    <div className="p-1 border-r border-gray-300">{totals.totalBunches}</div>
                    <div className="p-1 border-r border-gray-300">{totals.totalStems}</div>
                    <div className="p-1 border-r border-gray-300">0.00</div>
                    <div className="p-1 border-r border-gray-300">0.00</div>
                    <div className="p-1 border-r border-gray-300"></div> {/* unit price */}
                    <div className="p-1"></div> {/* total price */}
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-6 flex justify-between items-end">
                <p className="text-[10px] max-w-md">
                    All prices are FOB Quito. Please remember that you have 10 days after the date on the invoice to
                    make a claim and that we do not accept credits for freight or handling charges in any case.
                </p>
                <div className="text-sm">
                    <div className="flex border border-gray-300 w-64">
                         <div className="p-1 font-bold w-1/2 border-r border-gray-300">TOTAL FOB</div>
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
