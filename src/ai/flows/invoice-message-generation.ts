'use server';

/**
 * @fileOverview Generates personalized thank you messages for invoices using generative AI.
 *
 * - generateInvoiceMessage - A function that generates a personalized thank you message for an invoice.
 * - InvoiceMessageInput - The input type for the generateInvoiceMessage function.
 * - InvoiceMessageOutput - The return type for the generateInvoiceMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvoiceMessageInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  orderSummary: z.string().describe('A summary of the products and services in the order.'),
  invoiceTotal: z.number().describe('The total amount of the invoice.'),
  isFirstOrder: z.boolean().optional().describe('Whether this is the customer\'s first order.'),
});
export type InvoiceMessageInput = z.infer<typeof InvoiceMessageInputSchema>;

const InvoiceMessageOutputSchema = z.object({
  message: z.string().describe('The personalized thank you message for the invoice.'),
  isAppropriate: z.boolean().describe('Whether a personalized message is appropriate for this invoice.'),
});
export type InvoiceMessageOutput = z.infer<typeof InvoiceMessageOutputSchema>;

export async function generateInvoiceMessage(input: InvoiceMessageInput): Promise<InvoiceMessageOutput> {
  return invoiceMessageGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'invoiceMessagePrompt',
  input: {schema: InvoiceMessageInputSchema},
  output: {schema: InvoiceMessageOutputSchema},
  prompt: `You are an AI assistant specializing in generating thank you messages for invoices.

You will receive the customer's name, a summary of their order, and the invoice total.

Your goal is to generate a personalized thank you message that acknowledges their order and expresses gratitude.
If it's their first order, make sure to welcome them. Ensure the message is appropriate for the context of the order.
Also determine whether the message is appropriate at all, and populate the isAppropriate output field.

Customer Name: {{{customerName}}}
Order Summary: {{{orderSummary}}}
Invoice Total: {{{invoiceTotal}}}
Is First Order: {{#if isFirstOrder}}Yes{{else}}No{{/if}}

Message:`, // Keep newlines
});

const invoiceMessageGenerationFlow = ai.defineFlow(
  {
    name: 'invoiceMessageGenerationFlow',
    inputSchema: InvoiceMessageInputSchema,
    outputSchema: InvoiceMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
