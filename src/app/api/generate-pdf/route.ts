import { NextResponse } from 'next/server';
import { getInvoiceWithDetails } from '@/services/invoices';
import { generatePdfFromHtml } from '@/lib/pdf';
import { format, parseISO } from 'date-fns';

// This is a new, safe way to generate the HTML for the PDF
// It does not import any React components.
const generateInvoiceHtml = (details: Awaited<ReturnType<typeof getInvoiceWithDetails>>) => {
  if (!details) return '';

  const { invoice, customer, carguera, pais } = details;
  
  const totals = {
    totalBoxes: invoice?.items?.length || 0,
    totalBunches: 0,
    totalStems: 0,
    totalFob: 0,
  };

  invoice?.items?.forEach(item => {
    if (item.bunches && Array.isArray(item.bunches)) {
      item.bunches.forEach(bunch => {
        const bunchesCount = Number(bunch.bunches) || 0;
        const stemsPerBunch = Number(bunch.stemsPerBunch) || 0;
        const salePrice = Number(bunch.salePrice) || 0;

        totals.totalBunches += bunchesCount;
        const stemsInBunch = bunchesCount * stemsPerBunch;
        totals.totalStems += stemsInBunch;
        totals.totalFob += stemsInBunch * salePrice;
      });
    }
  });

  const itemsHtml = invoice.items.map(item => 
    item.bunches.map(bunch => {
      const totalPrice = (bunch.stemsPerBunch * bunch.bunches) * bunch.salePrice;
      const stemsPerBox = bunch.stemsPerBunch * bunch.bunches;
      return `
        <tr class="text-xs">
          <td class="p-1 text-center border-b border-l border-gray-300">${item.boxNumber}</td>
          <td class="p-1 text-center border-b border-l border-gray-300">${item.boxType.toUpperCase()}</td>
          <td class="p-1 text-left border-b border-l border-gray-300">${bunch.product}</td>
          <td class="p-1 text-left border-b border-l border-gray-300">${bunch.variety}</td>
          <td class="p-1 text-left border-b border-l border-gray-300">${bunch.color}</td>
          <td class="p-1 text-center border-b border-l border-gray-300">${bunch.length}</td>
          <td class="p-1 text-center border-b border-l border-gray-300">${stemsPerBox}</td>
          <td class="p-1 text-center border-b border-l border-gray-300">${bunch.bunches}</td>
          <td class="p-1 text-right border-b border-l border-gray-300">${bunch.salePrice.toFixed(3)}</td>
          <td class="p-1 text-right font-semibold border-b border-l border-r border-gray-300">$${totalPrice.toFixed(2)}</td>
        </tr>
      `;
    }).join('')
  ).join('');

  // Note: This uses Tailwind classes, but they must be inlined or available via a <style> tag for the PDF.
  // We'll rely on a basic style block for now.
  return `
    <div style="font-family: 'Alegreya', serif; font-size: 12px; color: black; background-color: white; padding: 2.5rem;">
      <header style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
        <div style="width: 50%;">
          <img src="https://firebasestorage.googleapis.com/v0/b/jcw-app-d7c43.appspot.com/o/logo.png?alt=media&token=e936d50f-20a2-41f2-9844-38d581e15e8b" alt="JCW Flowers Logo" style="width: 200px; height: auto;" />
          <div style="border: 1px solid #d1d5db; padding: 0.5rem; font-size: 10px; margin-top: 0.5rem;">
            <p><strong>E-MAIL:</strong> jcwf@outlook.es</p>
            <p><strong>PHONE:</strong> +593 096 744 1343</p>
            <p><strong>ADDRESS:</strong> Pasaje F y Calle Quito, EL QUINCHE - QUITO - ECUADOR</p>
          </div>
        </div>
        <div style="width: 50%; display: flex; flex-direction: column; align-items: flex-end;">
          <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; letter-spacing: 0.05em;">INVOICE</h1>
          <div style="width: 280px; font-size: 11px;">
            <div style="display: flex; border: 1px solid #d1d5db;">
              <div style="width: 33.33%; border-right: 1px solid #d1d5db; padding: 0.25rem; font-weight: bold;">DATE:</div>
              <div style="width: 66.67%; padding: 0.25rem; text-align: center;">${format(parseISO(invoice.flightDate), 'MM/dd/yyyy')}</div>
            </div>
            <div style="display: flex; border-left: 1px solid #d1d5db; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db;">
              <div style="width: 33.33%; border-right: 1px solid #d1d5db; padding: 0.25rem; font-weight: bold;">No.</div>
              <div style="width: 66.67%; padding: 0.25rem; text-align: center; font-weight: bold; font-size: 1.25rem;">${invoice.invoiceNumber}</div>
            </div>
          </div>
          <div style="width: 280px; font-size: 11px; margin-top: 1rem;">
            <div style="display: flex; border: 1px solid #d1d5db;">
              <div style="width: 33.33%; border-right: 1px solid #d1d5db; padding: 0.25rem; font-weight: bold;">AWB:</div>
              <div style="width: 66.67%; padding: 0.25rem; text-align: center;">${invoice.masterAWB}</div>
            </div>
            <div style="display: flex; border-left: 1px solid #d1d5db; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db;">
              <div style="width: 33.33%; border-right: 1px solid #d1d5db; padding: 0.25rem; font-weight: bold;">HAWB:</div>
              <div style="width: 66.67%; padding: 0.25rem; text-align: center;">${invoice.houseAWB}</div>
            </div>
          </div>
        </div>
      </header>
      <section style="border: 1px solid #d1d5db; padding: 0.5rem; margin-bottom: 1.5rem; font-size: 11px;">
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 0 1rem;">
          <strong>Name Client:</strong> <span>${customer?.name}</span>
          <strong>Mark:</strong> <span>${invoice.reference}</span>
          <strong>Agency:</strong> <span>${carguera?.nombreCarguera}</span>
          <strong>Address:</strong> <span>${customer?.address}</span>
          <strong>Country:</strong> <span>${pais?.nombre}</span>
        </div>
      </section>
      <section>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background-color: #f3f4f6; font-weight: bold; text-align: center;">
              <th style="padding: 0.25rem; border: 1px solid #d1d5db;">CAJAS</th>
              <th style="padding: 0.25rem; border: 1px solid #d1d5db;">TIPO DE CAJA</th>
              <th style="padding: 0.25rem; border: 1px solid #d1d5db; text-align: left;">NOMBRE DE LA FLOR</th>
              <th style="padding: 0.25rem; border: 1px solid #d1d5db; text-align: left;">VARIEDAD</th>
              <th style="padding: 0.25rem; border: 1px solid #d1d5db; text-align: left;">COLOR</th>
              <th style="padding: 0.25rem; border: 1px solid #d1d5db;">LONGITUD</th>
              <th style="padding: 0.25rem; border: 1px solid #d1d5db;">TALLOS POR CAJA</th>
              <th style="padding: 0.25rem; border: 1px solid #d1d5db;">BUNCHES POR CAJA</th>
              <th style="padding: 0.25rem; border: 1px solid #d1d5db;">PRECIO DE VENTA</th>
              <th style="padding: 0.25rem; border: 1px solid #d1d5db;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr style="background-color: #f9fafb; font-weight: bold; text-align: center; font-size: 11px;">
                <td style="padding: 0.25rem; border: 1px solid #d1d5db;">${totals.totalBoxes}</td>
                <td colspan="5" style="padding: 0.25rem; border: 1px solid #d1d5db;">TOTALES</td>
                <td style="padding: 0.25rem; border: 1px solid #d1d5db;">${totals.totalStems}</td>
                <td style="padding: 0.25rem; border: 1px solid #d1d5db;">${totals.totalBunches}</td>
                <td style="padding: 0.25rem; border: 1px solid #d1d5db;"></td>
                <td style="padding: 0.25rem; border: 1px solid #d1d5db;"></td>
            </tr>
          </tbody>
        </table>
      </section>
       <footer style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end;">
          <p style="font-size: 9px; max-width: 50%;">
              All prices are FOB Quito. Please remember that you have 10 days after the date on the invoice to
              make a claim and that we do not accept credits for freight or handling charges in any case.
          </p>
          <div style="font-size: 12px;">
              <div style="display: flex; border: 1px solid #d1d5db; width: 256px;">
                   <div style="padding: 0.25rem; font-weight: bold; width: 50%; border-right: 1px solid #d1d5db;">TOTAL FOB</div>
                   <div style="padding: 0.25rem; text-align: right; width: 50%; font-weight: bold;">$${totals.totalFob.toFixed(2)}</div>
              </div>
          </div>
      </footer>
    </div>
  `;
};

export async function POST(request: Request) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ message: 'Invoice ID is required' }, { status: 400 });
    }
    
    const invoiceDetails = await getInvoiceWithDetails(invoiceId);
    if (!invoiceDetails) {
        return NextResponse.json({ message: `Invoice with ID ${invoiceId} not found.` }, { status: 404 });
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8" />
          <title>Invoice ${invoiceDetails.invoice.invoiceNumber}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap" rel="stylesheet" />
          <style>
            body { 
              font-family: 'Alegreya', serif;
            }
          </style>
      </head>
      <body>
          ${generateInvoiceHtml(invoiceDetails)}
      </body>
      </html>
    `;

    const pdfBase64 = await generatePdfFromHtml(fullHtml);
    
    return NextResponse.json({ pdf: pdfBase64, invoiceNumber: invoiceDetails.invoice.invoiceNumber });

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: `Failed to generate PDF: ${errorMessage}` }, { status: 500 });
  }
}
