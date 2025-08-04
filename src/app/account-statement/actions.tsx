'use server';

import { z } from 'zod';
import { generatePdfFromHtml } from '@/lib/pdf';
import { sendEmailWithAttachments } from '@/services/email';
import { getInvoiceWithDetails } from '@/services/invoices';
import { InvoicePdf } from '@/app/invoices/[id]/invoice-pdf';

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
  const { renderToStaticMarkup } = await import('react-dom/server');
  
  const invoiceDetails = await getInvoiceWithDetails(invoiceId);
  if (!invoiceDetails) {
    throw new Error(`Invoice with ID ${invoiceId} not found.`);
  }

  // @ts-expect-error - RSC
  const html = renderToStaticMarkup(<InvoicePdf invoiceDetails={invoiceDetails} />);
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
        // Render the component to an HTML string on the server.
        const { html: invoiceHtml, invoiceNumber } = await renderInvoiceToHtml(invoiceId);

        // We need to provide a full HTML document structure for Puppeteer.
        // In a real-world scenario, you would want to inline your CSS here.
        const fullHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                  color: black;
                  background-color: white;
                }
                /* You would need to add all your CSS here or find a way to inline it */
                /* This is a very basic set of styles for the PDF */
                .invoice-card { border: 1px solid #ccc; padding: 1rem; margin: 1rem; font-size: 12px; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .items-start { align-items: flex-start; }
                .mb-6 { margin-bottom: 1.5rem; }
                .w-1\/2 { width: 50%; }
                .text-xs { font-size: 0.75rem; line-height: 1rem; }
                .mt-2 { margin-top: 0.5rem; }
                .p-2 { padding: 0.5rem; }
                .border { border: 1px solid #e5e7eb; }
                .items-end { align-items: flex-end; }
                .flex-col { flex-direction: column; }
                .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
                .font-bold { font-weight: 700; }
                .mb-4 { margin-bottom: 1rem; }
                .tracking-wider { letter-spacing: 0.05em; }
                .w-\[280px\] { width: 280px; }
                .text-center { text-align: center; }
                .text-base { font-size: 1rem; line-height: 1.5rem; }
                .mt-4 { margin-top: 1rem; }
                .grid { display: grid; }
                .grid-cols-\[auto,1fr\] { grid-template-columns: auto 1fr; }
                .gap-x-4 { column-gap: 1rem; }
                .grid-cols-\[40px,50px,1fr,1fr,1fr,60px,80px,80px,80px,80px\] { grid-template-columns: 40px 50px 1fr 1fr 1fr 60px 80px 80px 80px 80px; }
                .bg-gray-100 { background-color: #f3f4f6; }
                .border-t { border-top-width: 1px; }
                .border-l { border-left-width: 1px; }
                .border-r { border-right-width: 1px; }
                .text-\[10px\] { font-size: 10px; }
                .leading-tight { line-height: 1.25; }
                .p-1 { padding: 0.25rem; }
                .border-r { border-right-width: 1px; }
                .text-left { text-align: left; }
                .border-b { border-bottom-width: 1px; }
                .font-semibold { font-weight: 600; }
                .text-right { text-align: right; }
                .bg-gray-50 { background-color: #f9fafb; }
                .col-span-5 { grid-column: span 5 / span 5; }
                .mt-6 { margin-top: 1.5rem; }
                .items-end { align-items: flex-end; }
                .max-w-md { max-width: 28rem; }
                .w-64 { width: 16rem; }
                .contents { display: contents; }
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
