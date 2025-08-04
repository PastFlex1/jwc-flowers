'use server';

import React from 'react';
import { z } from 'zod';
import { renderToStaticMarkup } from 'react-dom/server';
import { v4 as uuidv4 } from 'uuid';

import { generatePdfFromHtml } from '@/lib/pdf';
import { sendEmailWithAttachments } from '@/services/email';
import { getInvoiceWithDetails } from '@/services/invoices';
import { InvoiceDetailView } from './[id]/invoice-detail-view';

const formSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  invoiceId: z.string(),
});

type SendInvoiceInput = z.infer<typeof formSchema>;

export async function sendInvoiceAction(input: SendInvoiceInput) {
  const validation = formSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }
  
  const { to, subject, body, invoiceId } = validation.data;

  try {
    const invoiceDetails = await getInvoiceWithDetails(invoiceId);
    if (!invoiceDetails) {
        throw new Error(`Invoice with ID ${invoiceId} not found.`);
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

    const invoiceComponent = React.createElement(InvoiceDetailView, invoiceDetails);
    const invoiceHtmlString = renderToStaticMarkup(invoiceComponent);

    const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <title>Invoice ${invoice.invoiceNumber}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap" rel="stylesheet" />
            <style>
            body { 
                font-family: 'Alegreya', serif;
                font-size: 12px;
            }
            </style>
        </head>
        <body>
            ${invoiceHtmlString}
        </body>
        </html>
    `;
    
    const pdfBase64 = await generatePdfFromHtml(fullHtml);
    
    const attachments = [{
        filename: `Factura-${invoiceDetails.invoice.invoiceNumber}.pdf`,
        content: pdfBase64,
    }];

    await sendEmailWithAttachments({
      to,
      subject,
      body,
      attachments,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to process and send invoice: ${errorMessage}` };
  }
}
