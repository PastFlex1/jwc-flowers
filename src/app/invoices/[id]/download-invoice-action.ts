'use server';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { v4 as uuidv4 } from 'uuid';

import { getInvoiceWithDetails } from '@/services/invoices';
import { generatePdfFromHtml } from '@/lib/pdf';
import { InvoiceDetailView } from './invoice-detail-view';

export async function downloadInvoiceAction(invoiceId: string): Promise<{ success: boolean; pdf?: string; error?: string }> {
  if (!invoiceId) {
    return { success: false, error: 'Invoice ID is required' };
  }

  try {
    const invoiceDetails = await getInvoiceWithDetails(invoiceId);
    if (!invoiceDetails) {
      return { success: false, error: `Invoice with ID ${invoiceId} not found.` };
    }

    const { invoice } = invoiceDetails;
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

    const invoiceComponent = React.createElement(InvoiceDetailView, {
      ...invoiceDetails,
    });
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
              .no-print {
                  display: none !important;
              }
          </style>
      </head>
      <body>
          ${invoiceHtml}
      </body>
      </html>
    `;

    const pdfBase64 = await generatePdfFromHtml(fullHtml);
    return { success: true, pdf: pdfBase64 };

  } catch (error) {
    console.error('Error generating PDF for download:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to generate PDF: ${errorMessage}` };
  }
}
