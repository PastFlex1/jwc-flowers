'use server';

import { z } from 'zod';
import { generatePdfFromHtml } from '@/lib/pdf';
import { sendEmailWithAttachments } from '@/services/email';
import { InvoicePdf } from './invoice-pdf';

const formSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  invoiceIds: z.array(z.string()),
});

type SendDocumentsInput = z.infer<typeof formSchema>;

// This function is defined as a React Server Component.
// It can be rendered to HTML, and that HTML can be passed to the PDF generator.
async function renderInvoiceToHtml(invoiceId: string) {
  const React = await import('react');
  const { renderToString } = await import('react-dom/server');
  // @ts-expect-error - RSC
  const html = renderToString(<InvoicePdf invoiceId={invoiceId} />);
  return html;
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
        // Render the component to an HTML string on the server.
        const invoiceHtml = await renderInvoiceToHtml(invoiceId);

        // We need to provide a full HTML document structure for Puppeteer.
        // In a real-world scenario, you would want to inline your CSS here.
        const fullHtml = `
          <html>
            <head>
              <style>
                /* Basic styles to make it look somewhat okay. A real implementation would need more. */
                body { font-family: sans-serif; }
                .card { border: 1px solid #ccc; padding: 1rem; margin: 1rem; }
                /* You would need to add all your CSS here or find a way to inline it */
              </style>
            </head>
            <body>
              ${invoiceHtml}
            </body>
          </html>
        `;
        
        const pdfBase64 = await generatePdfFromHtml(fullHtml);
        
        // For now, we'll extract the invoice number from the component, but a better approach
        // would be to fetch it once before mapping.
        const invoiceNumberMatch = invoiceHtml.match(/<div class="w-2\/3 p-1 text-center font-bold text-base">([^<]+)<\/div>/);
        const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1] : `Factura-sin-numero`;

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
