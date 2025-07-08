'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { InvoiceActions } from './invoice-actions';
import type { Invoice, Customer, Consignatario, Carguera, Pais } from '@/lib/types';
import InvoiceDownloadButton from './invoice-download-button';

type InvoiceDetailViewProps = {
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
  carguera: Carguera | null;
  pais: Pais | null;
};

export function InvoiceDetailView({ invoice, customer, consignatario, carguera, pais }: InvoiceDetailViewProps) {
  
  const groupedItems = React.useMemo(() => {
    const groups: { parent: Invoice['items'][0]; children: Invoice['items'] }[] = [];
    if (!invoice?.items) return groups;

    invoice.items.forEach(item => {
      if (!item.isSubItem) {
        groups.push({ parent: item, children: [] });
      } else if (groups.length > 0) {
        groups[groups.length - 1].children.push(item);
      }
    });
    return groups;
  }, [invoice.items]);

  const totals = React.useMemo(() => {
     const totalBoxes = groupedItems.reduce((acc, group) => acc + (group.parent.boxCount || 0), 0);
     const allItems = groupedItems.flatMap(g => [g.parent, ...g.children]);
     
     const totalFullBoxes = allItems.reduce((acc, item) => acc + (item.fullBoxes || 0), 0);
     const totalBunchByBox = allItems.reduce((acc, item) => acc + (item.bunchCount || 0), 0);
     const totalStemsByBox = allItems.reduce((acc, item) => acc + ((item.stemCount || 0) * (item.bunchCount || 0)), 0);
     const totalFob = allItems.reduce((acc, item) => {
        const stems = (item.stemCount || 0) * (item.bunchCount || 0);
        return acc + (stems * (item.salePrice || 0));
     }, 0);

     return {
        totalBoxes,
        totalFullBoxes,
        totalBunchByBox,
        totalStemsByBox,
        totalFob
     }
  }, [groupedItems]);

  const renderItemRow = (item: Invoice['items'][0], isParent: boolean, index: number) => {
    const stemsByBox = (item.stemCount || 0) * (item.bunchCount || 0);
    const totalPrice = stemsByBox * (item.salePrice || 0);
    return (
       <React.Fragment key={item.id || index}>
        <div className="contents">
          <div className="border-b border-l border-border print:border-gray-200 p-1 text-center">{isParent ? index + 1 : ''}</div>
          <div className="border-b border-l border-border print:border-gray-200 p-1 text-center">{isParent ? item.boxCount : ''}</div>
          <div className="border-b border-l border-border print:border-gray-200 p-1 text-center">{isParent ? item.boxType.toUpperCase() : ''}</div>
          <div className="border-b border-l border-border print:border-gray-200 p-1">{item.product}</div>
          <div className="border-b border-l border-border print:border-gray-200 p-1">{item.variety}</div>
          <div className="border-b border-l border-border print:border-gray-200 p-1 text-center">{item.length}</div>
          <div className="border-b border-l border-border print:border-gray-200 p-1 text-right">{item.fullBoxes.toFixed(2)}</div>
          <div className="border-b border-l border-border print:border-gray-200 p-1 text-center">{item.stemCount}</div>
          <div className="border-b border-l border-border print:border-gray-200 p-1 text-center">{item.bunchCount}</div>
          <div className="border-b border-l border-border print:border-gray-200 p-1 text-center">{stemsByBox}</div>
          <div className="border-b border-l border-border print:border-gray-200 p-1 text-right">{item.salePrice.toFixed(2)}</div>
          <div className="border-b border-r border-l border-border print:border-gray-200 p-1 text-right font-semibold">${totalPrice.toFixed(2)}</div>
        </div>
       </React.Fragment>
    )
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center no-print">
          <InvoiceActions />
          <div className="flex gap-2">
             {customer && (
                <InvoiceDownloadButton />
            )}
          </div>
        </div>
        
        <Card className="p-4 sm:p-6 shadow-lg border bg-white text-foreground print:shadow-none print:border-0 print:text-black" id="invoice-to-print">
          <CardContent className="p-0 text-[10px] leading-tight">
            {/* Header Section */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Left Header */}
                <div className="space-y-2">
                    <Image
                      src="/logo.png"
                      alt="JCW Flowers Logo"
                      width={250}
                      height={80}
                      className="h-auto"
                    />
                    <div className="border border-border print:border-gray-200 p-2">
                        <div className="grid grid-cols-[auto,1fr] gap-x-2">
                            <span className="font-bold">E-MAIL:</span><span>jcwf@outlook.es</span>
                            <span className="font-bold">PHONE:</span><span>+593 096 744 1343</span>
                            <span className="font-bold">ADDRESS:</span><span>Pasaje F y Calle Quito, EL QUINCHE - QUITO - ECUADOR</span>
                        </div>
                    </div>
                </div>
                {/* Right Header */}
                <div className="flex flex-col items-end space-y-2">
                     <h1 className="text-2xl font-bold">INVOICE</h1>
                     <div className="grid grid-cols-2 border border-border print:border-gray-200 w-64">
                         <div className="border-r border-border print:border-gray-200 p-1 font-bold text-center">DATE:</div>
                         <div className="p-1 text-center">{format(parseISO(invoice.flightDate), 'P')}</div>
                         <div className="border-t border-border print:border-gray-200 border-r border-r-border print:border-r-gray-200 p-1 font-bold text-center">No.</div>
                         <div className="border-t border-border print:border-gray-200 p-1 text-center font-bold text-lg">{invoice.invoiceNumber}</div>
                     </div>
                     <div className="grid grid-cols-2 border border-border print:border-gray-200 w-64 mt-auto">
                         <div className="border-r border-border print:border-gray-200 p-1 font-bold text-center">AWB:</div>
                         <div className="p-1 text-center">{invoice.masterAWB}</div>
                         <div className="border-t border-border print:border-gray-200 border-r border-r-border print:border-r-gray-200 p-1 font-bold text-center">HAWB:</div>
                         <div className="border-t border-border print:border-gray-200 p-1 text-center">{invoice.houseAWB}</div>
                     </div>
                </div>
            </div>

            {/* Client Info Section */}
            <div className="border border-border print:border-gray-200 p-2 mb-4">
                 <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1">
                    <span className="font-bold">Name Client:</span><span>{customer?.name}</span>
                    <span className="font-bold">Mark:</span><span>{invoice.reference}</span>
                    <span className="font-bold">Agency:</span><span>{carguera?.nombreCarguera}</span>
                    <span className="font-bold">Address:</span><span>{consignatario?.direccion}</span>
                    <span className="font-bold">Country:</span><span>{pais?.nombre}</span>
                 </div>
            </div>

            {/* Items Table */}
            <div className="border-t border-l border-r border-border print:border-gray-200 grid grid-cols-[25px,40px,40px,1fr,1fr,50px,60px,60px,60px,60px,60px,70px] font-bold text-center bg-muted print:bg-gray-100">
                <div className="border-b border-r border-border print:border-gray-200 p-1">CODE</div>
                <div className="border-b border-r border-border print:border-gray-200 p-1">BOXES</div>
                <div className="border-b border-r border-border print:border-gray-200 p-1">BOX TYPE</div>
                <div className="border-b border-r border-border print:border-gray-200 p-1">PRODUCT</div>
                <div className="border-b border-r border-border print:border-gray-200 p-1">VARIETY</div>
                <div className="border-b border-r border-border print:border-gray-200 p-1">LENGTH</div>
                <div className="border-b border-r border-border print:border-gray-200 p-1">FULL BOXES</div>
                <div className="border-b border-r border-border print:border-gray-200 p-1">STEMS BY BUNCH</div>
                <div className="border-b border-r border-border print:border-gray-200 p-1">BUNCH BY BOX</div>
                <div className="border-b border-r border-border print:border-gray-200 p-1">STEMS BY BOX</div>
                <div className="border-b border-r border-border print:border-gray-200 p-1">UNIT PRICE</div>
                <div className="border-b border-border print:border-gray-200 p-1">TOTAL PRICE</div>
            </div>
            <div className="border-l border-r border-b border-border print:border-gray-200 grid grid-cols-[25px,40px,40px,1fr,1fr,50px,60px,60px,60px,60px,60px,70px]">
                {groupedItems.map((group, index) => (
                    <React.Fragment key={group.parent.id || index}>
                      {renderItemRow(group.parent, true, index)}
                      {group.children.map((child, childIndex) => renderItemRow(child, false, childIndex))}
                    </React.Fragment>
                ))}
            </div>
             <div className="border-l border-r border-border print:border-gray-200 grid grid-cols-[25px,40px,40px,1fr,1fr,50px,60px,60px,60px,60px,60px,70px] font-bold">
                 <div className="border-b border-r border-border print:border-gray-200 p-1 col-span-1"></div>
                 <div className="border-b border-r border-border print:border-gray-200 p-1 text-center">{totals.totalBoxes}</div>
                 <div className="border-b border-r border-border print:border-gray-200 p-1 col-span-4 text-center font-bold">TOTALES</div>
                 <div className="border-b border-r border-border print:border-gray-200 p-1 text-right">{totals.totalFullBoxes.toFixed(2)}</div>
                 <div className="border-b border-r border-border print:border-gray-200 p-1"></div>
                 <div className="border-b border-r border-border print:border-gray-200 p-1 text-center">{totals.totalBunchByBox}</div>
                 <div className="border-b border-r border-border print:border-gray-200 p-1 text-center">{totals.totalStemsByBox}</div>
                 <div className="border-b border-r border-border print:border-gray-200 p-1 col-span-2"></div>
            </div>

            {/* Footer */}
            <div className="mt-4 grid grid-cols-2 gap-4">
                <p className="text-xs">
                    All prices are FOB Quito. Please remember that you have 10 days after the date on the invoice to make a claim and that we do not accept credits for freight or handling charges in any case.
                </p>
                <div className="flex justify-end">
                    <div className="grid grid-cols-2 border border-border print:border-gray-200 w-64 font-bold">
                        <div className="p-1 border-r border-border print:border-gray-200">TOTAL FOB</div>
                        <div className="p-1 text-right">${totals.totalFob.toFixed(2)}</div>
                    </div>
                </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </>
  );
}
