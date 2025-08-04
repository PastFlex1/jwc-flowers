'use server';

import { z } from 'zod';

import { sendEmailWithAttachments } from '@/services/email';

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
     // This is a placeholder for the actual domain, in a real app, use environment variables
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

    const response = await fetch(`${baseUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to generate PDF for invoice ${invoiceId}`);
    }

    const { pdf, invoiceNumber } = await response.json();

    const attachments = [{
        filename: `Factura-${invoiceNumber}.pdf`,
        content: pdf,
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
