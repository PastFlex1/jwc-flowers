'use server';

import { z } from 'zod';

import { sendEmailWithAttachments } from '@/services/email';

const formSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  invoiceIds: z.array(z.string()),
});

type SendDocumentsInput = z.infer<typeof formSchema>;

async function generatePdfForInvoice(invoiceId: string): Promise<{ content: string; filename: string }> {
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
  
  return {
    content: pdf,
    filename: `Factura-${invoiceNumber}.pdf`,
  };
}


export async function sendDocumentsAction(input: SendDocumentsInput) {
  const validation = formSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: 'Invalid input.' };
  }
  
  const { to, subject, body, invoiceIds } = validation.data;

  try {
    const attachments = await Promise.all(
      invoiceIds.map(invoiceId => generatePdfForInvoice(invoiceId))
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
