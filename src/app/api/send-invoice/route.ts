
import { NextResponse } from 'next/server';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { getInvoiceById } from '@/services/invoices';
import { getCustomerById } from '@/services/customers';
import { getConsignatarioById } from '@/services/consignatarios';
import { getCargueraById } from '@/services/cargueras';
import { getPaisById } from '@/services/paises';
import { InvoicePdfView } from '@/app/invoices/[id]/invoice-pdf-view';
import { generatePdfFromHtml } from '@/lib/pdf';
import type { Invoice, Customer, Consignatario, Carguera, Pais } from '@/lib/types';


const resend = new Resend(process.env.RESEND_API_KEY);

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function generateInvoiceXml(invoice: Invoice, customer: Customer | null): string {
    let totalFob = 0;
    const itemsXml = invoice.items.map(item => {
        return item.bunches.map(bunch => {
            const totalPrice = (bunch.stemsPerBunch * bunch.bunches) * bunch.salePrice;
            totalFob += totalPrice;
            return `
        <Item>
            <BoxNumber>${item.boxNumber}</BoxNumber>
            <BoxType>${escapeXml(item.boxType.toUpperCase())}</BoxType>
            <Product>${escapeXml(bunch.product)}</Product>
            <Variety>${escapeXml(bunch.variety)}</Variety>
            <Color>${escapeXml(bunch.color)}</Color>
            <Length>${bunch.length}</Length>
            <StemsPerBunch>${bunch.stemsPerBunch}</StemsPerBunch>
            <Bunches>${bunch.bunches}</Bunches>
            <SalePrice>${bunch.salePrice.toFixed(3)}</SalePrice>
            <Total>${totalPrice.toFixed(2)}</Total>
        </Item>`;
        }).join('');
    }).join('');

    const xmlString = `
<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
    <Header>
        <InvoiceNumber>${escapeXml(invoice.invoiceNumber)}</InvoiceNumber>
        <FlightDate>${invoice.flightDate}</FlightDate>
        <FarmDepartureDate>${invoice.farmDepartureDate}</FarmDepartureDate>
        <Status>${escapeXml(invoice.status)}</Status>
        <MasterAWB>${escapeXml(invoice.masterAWB)}</MasterAWB>
        <HouseAWB>${escapeXml(invoice.houseAWB)}</HouseAWB>
    </Header>
    <Customer>
        <Name>${escapeXml(customer?.name || '')}</Name>
        <Id>${escapeXml(customer?.cedula || '')}</Id>
        <Address>${escapeXml(customer?.address || '')}</Address>
        <Country>${escapeXml(customer?.pais || '')}</Country>
        <Email>${escapeXml(customer?.email || '')}</Email>
    </Customer>
    <Items>
        ${itemsXml}
    </Items>
    <Totals>
        <TotalFOB>${totalFob.toFixed(2)}</TotalFOB>
    </Totals>
</Invoice>`.trim();

    return xmlString;
}


export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Resend API key is not configured.');
    }

    const body = await request.json();
    const { to, subject, body: emailBody, invoiceId } = body;

    if (!to || !subject || !emailBody || !invoiceId) {
      return NextResponse.json({ message: 'Missing required fields in request.' }, { status: 400 });
    }

    // --- Fetch all data for the invoice ---
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found.' }, { status: 404 });
    }
    
    // Ensure items and bunches have IDs for key props if they are missing
    invoice.items.forEach(item => {
      if (!item.id) item.id = uuidv4();
      item.bunches.forEach(bunch => {
        if (!bunch.id) bunch.id = uuidv4();
      });
    });

    const customer = await getCustomerById(invoice.customerId);
    const consignatario = invoice.consignatarioId ? await getConsignatarioById(invoice.consignatarioId) : null;
    const carguera = invoice.carrierId ? await getCargueraById(invoice.carrierId) : null;
    const pais = invoice.countryId ? await getPaisById(invoice.countryId) : null;

    // --- Generate PDF ---
    const invoiceHtml = renderToStaticMarkup(
      React.createElement(InvoicePdfView, { invoice, customer, consignatario, carguera, pais })
    );
    const pdfBase64 = await generatePdfFromHtml(`<html><head><style>@import url('https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap'); body { font-family: 'Alegreya', serif; }</style></head><body>${invoiceHtml}</body></html>`);

    // --- Generate XML ---
    const xmlContent = generateInvoiceXml(invoice, customer);
    const xmlBase64 = Buffer.from(xmlContent, 'utf-8').toString('base64');
    
    // --- Send Email ---
    await resend.emails.send({
      from: 'JCW Flowers <facturacion@puntodeventastore.store>',
      to: [to],
      subject: subject,
      html: `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
      attachments: [
        {
          filename: `Factura-${invoice.invoiceNumber.trim()}.pdf`,
          content: pdfBase64,
        },
        {
          filename: `Factura-${invoice.invoiceNumber.trim()}.xml`,
          content: xmlBase64,
        }
      ],
    });

    return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });

  } catch (error) {
    console.error('Failed to send invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Failed to process and send email: ${errorMessage}` }, { status: 500 });
  }
}
