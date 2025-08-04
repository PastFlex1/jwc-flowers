'use server';

import { z } from 'zod';
import { generatePdfFromHtml } from '@/lib/pdf';
import { sendEmailWithAttachments } from '@/services/email';
import { getInvoiceWithDetails } from '@/services/invoices';
import { InvoicePdf } from './[id]/invoice-pdf';

const formSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  invoiceId: z.string(),
});

type SendInvoiceInput = z.infer<typeof formSchema>;

async function renderInvoiceToHtml(invoiceId: string) {
  const React = await import('react');
  const { renderToString } = await import('react-dom/server');
  // @ts-expect-error - RSC
  const html = renderToString(<InvoicePdf invoiceId={invoiceId} />);
  return html;
}

export async function sendInvoiceAction(input: SendInvoiceInput) {
  const validation = formSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }
  
  const { to, subject, body, invoiceId } = validation.data;

  try {
    const invoiceDetails = await getInvoiceWithDetails(invoiceId);
    if (!invoiceDetails) {
        return { success: false, error: 'Invoice not found.' };
    }

    const invoiceHtml = await renderInvoiceToHtml(invoiceId);

    const fullHtml = `
      <html>
        <head>
          <style>
            /* This requires your full app's CSS to be inlined for accurate PDF rendering */
            /* A more robust solution would involve a CSS-in-JS library or inlining build step */
            body { 
                font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            .invoice-card { border: 1px solid #eee; padding: 2rem; margin: 1rem; }
          </style>
        </head>
        <body>
          ${invoiceHtml}
        </body>
      </html>
    `;
    
    const pdfBase64 = await generatePdfFromHtml(fullHtml);
    const invoiceNumber = invoiceDetails.invoice.invoiceNumber;
    
    const attachments = [{
        filename: `Factura-${invoiceNumber}.pdf`,
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
