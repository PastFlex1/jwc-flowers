'use server';

import React from 'react';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { renderToStaticMarkup } from 'react-dom/server';

import { generatePdfFromHtml } from '@/lib/pdf';
import { sendEmailWithAttachments } from '@/services/email';
import { getInvoiceWithDetails } from '@/services/invoices';
import { InvoiceDetailView } from '@/app/invoices/[id]/invoice-detail-view';

const formSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  invoiceIds: z.array(z.string()),
});

type SendDocumentsInput = z.infer<typeof formSchema>;

async function renderInvoiceToHtml(invoiceId: string) {
  const invoiceDetails = await getInvoiceWithDetails(invoiceId);
  if (!invoiceDetails) {
    throw new Error(`Invoice with ID ${invoiceId} not found.`);
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
          }
        </style>
      </head>
      <body>
        ${invoiceHtml}
      </body>
    </html>
  `;

  return { html: fullHtml, invoiceNumber: invoiceDetails.invoice.invoiceNumber };
}


export async function sendDocumentsAction(input: SendDocumentsInput) {
  const validation = formSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }
  
  const { to, subject, body, invoiceIds } = validation.data;

  try {
    const attachments = await Promise.all(
      invoiceIds.map(async (invoiceId) => {
        const { html: invoiceHtml, invoiceNumber } = await renderInvoiceToHtml(invoiceId);
        const pdfBase64 = await generatePdfFromHtml(invoiceHtml);
        
        return {
          filename: `Factura-${invoiceNumber}.pdf`,
          content: pdfBase64,
        };
      })
    );

    await sendEmailWithAttachments({
      to,
      subject,
      body,
      attachments,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send documents:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to process and send documents: ${errorMessage}` };
  }
}
