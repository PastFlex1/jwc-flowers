'use server';

import { z } from 'zod';
import ReactDOMServer from 'react-dom/server';
import { getInvoiceById } from '@/services/invoices';
import { getCustomerById } from '@/services/customers';
import { getConsignatarioById } from '@/services/consignatarios';
import { getCargueraById } from '@/services/cargueras';
import { getPaisById } from '@/services/paises';
import { InvoiceDetailView } from '@/app/invoices/[id]/invoice-detail-view';
import { generatePdfFromHtml } from '@/lib/pdf';
import { sendEmailWithAttachments } from '@/services/email';
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  invoiceIds: z.array(z.string()),
});

type SendDocumentsInput = z.infer<typeof formSchema>;

export async function sendDocumentsAction(input: SendDocumentsInput) {
  const validation = formSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }
  
  const { to, subject, body, invoiceIds } = validation.data;

  try {
    const attachments = await Promise.all(
      invoiceIds.map(async (invoiceId) => {
        const invoice = await getInvoiceById(invoiceId);
        if (!invoice) throw new Error(`Invoice with ID ${invoiceId} not found.`);

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

        const customer = await getCustomerById(invoice.customerId);
        const consignatario = invoice.consignatarioId ? await getConsignatarioById(invoice.consignatarioId) : null;
        const carguera = invoice.carrierId ? await getCargueraById(invoice.carrierId) : null;
        const pais = invoice.countryId ? await getPaisById(invoice.countryId) : null;

        // Render React component to HTML string on the server
        const invoiceHtml = ReactDOMServer.renderToString(
          <InvoiceDetailView
            invoice={invoice}
            customer={customer}
            consignatario={consignatario}
            carguera={carguera}
            pais={pais}
          />
        );

        // This is a simplified wrapper. You'd need to inject the full HTML structure with CSS.
        // For Tailwind to work, you'd need a more complex setup to inline styles.
        // For now, let's assume basic HTML output.
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
        
        return {
          filename: `Factura-${invoice.invoiceNumber}.pdf`,
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
