'use server';

import { z } from 'zod';
import { generatePdfFromHtml } from '@/lib/pdf';
import { sendEmailWithAttachments } from '@/services/email';
import { getInvoiceWithDetails } from '@/services/invoices';
import { InvoicePdf } from '@/app/invoices/invoice-pdf';

const formSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  invoiceIds: z.array(z.string()),
});

type SendDocumentsInput = z.infer<typeof formSchema>;

async function renderInvoiceToHtml(invoiceId: string) {
  const React = await import('react');
  const { renderToString } = await import('react-dom/server');
  
  const invoiceDetails = await getInvoiceWithDetails(invoiceId);
  if (!invoiceDetails) {
    throw new Error(`Invoice with ID ${invoiceId} not found.`);
  }

  // Use renderToString for async server components
  const html = renderToString(React.createElement(InvoicePdf, { invoiceDetails }));
  return { html, invoiceNumber: invoiceDetails.invoice.invoiceNumber };
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

        const fullHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <style>
                body { font-family: sans-serif; }
                /* Add critical CSS for PDF here */
              </style>
            </head>
            <body>
              ${invoiceHtml}
            </body>
          </html>
        `;
        
        const pdfBase64 = await generatePdfFromHtml(fullHtml);
        
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
