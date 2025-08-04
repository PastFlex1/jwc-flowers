'use server';

import { z } from 'zod';
import { generatePdfFromHtml } from '@/lib/pdf';
import { sendEmailWithAttachments } from '@/services/email';
import { getInvoiceWithDetails } from '@/services/invoices';
import { InvoicePdf } from './[id]/invoice-pdf';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';


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

    const invoiceHtml = renderToStaticMarkup(
      React.createElement(InvoicePdf, { invoiceDetails })
    );

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
           <link rel="preconnect" href="https://fonts.googleapis.com" />
           <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
           <style>
             body { font-family: 'Alegreya', sans-serif; }
             /* You can include more critical CSS for the PDF here if needed */
           </style>
        </head>
        <body>
          ${invoiceHtml}
        </body>
      </html>
    `;
    
    const pdfBase64 = await generatePdfFromHtml(fullHtml);
    
    const attachment = {
        filename: `Factura-${invoiceDetails.invoice.invoiceNumber}.pdf`,
        content: pdfBase64,
    };

    await sendEmailWithAttachments({
      to,
      subject,
      body,
      attachments: [attachment],
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to process and send invoice: ${errorMessage}` };
  }
}
