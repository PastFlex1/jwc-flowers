
import { NextResponse } from 'next/server';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';

import { getInvoiceWithDetails } from '@/services/invoices';
import { generatePdfFromHtml } from '@/lib/pdf';
import { InvoicePdfView } from '@/app/invoices/[id]/invoice-pdf-view';
import { AccountStatementView } from '@/app/account-statement/account-statement-view';
import type { Customer, Invoice } from '@/lib/types';


const resend = new Resend(process.env.RESEND_API_KEY);

function renderInvoiceToHtml(invoiceData: any): string {
  // Ensure items and bunches have IDs for client-side key props
  if (invoiceData.invoice.items && Array.isArray(invoiceData.invoice.items)) {
    invoiceData.invoice.items.forEach((item: any) => {
      if (!item.id) item.id = uuidv4();
      if (item.bunches && Array.isArray(item.bunches)) {
        item.bunches.forEach((bunch: any) => {
            if (!bunch.id) bunch.id = uuidv4();
        });
      }
    });
  }

  // Use `renderToStaticMarkup` to render the component to a static HTML string.
  // This is safe to use on the server.
  const html = renderToStaticMarkup(
    React.createElement(InvoicePdfView, {
      invoice: invoiceData.invoice,
      customer: invoiceData.customer,
      consignatario: invoiceData.consignatario,
      carguera: invoiceData.carguera,
      pais: invoiceData.pais,
    })
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          /* Minimal styles to replicate the look */
           body { font-family: 'Alegreya', sans-serif; color: black; background-color: white; }
          .print\\:shadow-none { box-shadow: none; }
          .print\\:border-0 { border-width: 0; }
          /* You may need to copy more Tailwind-like styles here for full fidelity */
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
}

function renderStatementToHtml(data: any): string {
    const html = renderToStaticMarkup(
        React.createElement(AccountStatementView, { data })
    );

     return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
           body { font-family: 'Alegreya', sans-serif; color: black; background-color: white; }
          .print\\:shadow-none { box-shadow: none; }
          .print\\:border-0 { border-width: 0; }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, invoiceIds, invoiceId, isStatement, statementData } = body;

    if (!process.env.RESEND_API_KEY) {
        throw new Error('Resend API key is not configured.');
    }

    let attachments = [];

    if (isStatement) {
        // Handle sending multiple invoices as part of a statement
        const customer = statementData.customer as Customer;
        const invoices = statementData.invoices as Invoice[];
        
        // Generate and attach the Account Statement PDF
        const statementHtml = renderStatementToHtml(statementData);
        const statementPdf = await generatePdfFromHtml(statementHtml);
        attachments.push({
            filename: `Estado-de-Cuenta-${customer.name.replace(/ /g, '_')}.pdf`,
            content: statementPdf,
        });

        // Generate and attach selected Invoice PDFs
        for (const id of invoiceIds) {
            const invoiceData = await getInvoiceWithDetails(id);
            if (invoiceData) {
                const invoiceHtml = renderInvoiceToHtml(invoiceData);
                const pdf = await generatePdfFromHtml(invoiceHtml);
                attachments.push({
                    filename: `Factura-${invoiceData.invoice.invoiceNumber}.pdf`,
                    content: pdf,
                });
            }
        }

    } else {
        // Handle sending a single invoice
        const invoiceData = await getInvoiceWithDetails(invoiceId);
        if (!invoiceData) {
          return NextResponse.json({ message: 'Invoice not found.' }, { status: 404 });
        }
        
        const invoiceHtml = renderInvoiceToHtml(invoiceData);
        const pdf = await generatePdfFromHtml(invoiceHtml);
        attachments.push({
            filename: `Factura-${invoiceData.invoice.invoiceNumber}.pdf`,
            content: pdf,
        });
    }

    await resend.emails.send({
      from: 'JCW Flowers <facturacion@puntodeventastore.tienda>',
      to: [to],
      subject: subject,
      html: `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
      attachments: attachments,
    });

    return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Failed to send invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Failed to process and send email: ${errorMessage}` }, { status: 500 });
  }
}
