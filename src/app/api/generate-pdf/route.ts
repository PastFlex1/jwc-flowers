import { NextResponse } from 'next/server';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { v4 as uuidv4 } from 'uuid';

import { getInvoiceWithDetails } from '@/services/invoices';
import { generatePdfFromHtml } from '@/lib/pdf';
import { InvoiceDetailView } from '@/app/invoices/[id]/invoice-detail-view';

export async function POST(request: Request) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ message: 'Invoice ID is required' }, { status: 400 });
    }
    
    const invoiceDetails = await getInvoiceWithDetails(invoiceId);
    if (!invoiceDetails) {
        return NextResponse.json({ message: `Invoice with ID ${invoiceId} not found.` }, { status: 404 });
    }
    
    const { invoice } = invoiceDetails;
     // Ensure items and bunches have IDs for client-side key props
    if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
        if (!item.id) item.id = uuidv4();
        if (item.bunches && Array.isArray(item.bunches)) {
            item.bunches.forEach(bunch => {
                if (!bunch.id) bunch.id = uuidv4();
            });
        }
        });
    }

    const invoiceComponent = React.createElement(InvoiceDetailView, invoiceDetails);
    const invoiceHtml = renderToStaticMarkup(invoiceComponent);

    const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <title>Invoice ${invoice.invoiceNumber}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap" rel="stylesheet" />
            <style>
            body { 
                font-family: 'Alegreya', serif;
                font-size: 12px;
                background-color: white !important;
            }
            </style>
        </head>
        <body>
            ${invoiceHtml}
        </body>
        </html>
    `;

    const pdfBase64 = await generatePdfFromHtml(fullHtml);
    
    return NextResponse.json({ pdf: pdfBase64, invoiceNumber: invoice.invoiceNumber });

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Failed to generate PDF: ${errorMessage}` }, { status: 500 });
  }
}
