import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { format, parseISO } from 'date-fns';
import type { Invoice, Customer, Consignatario, Carguera, Pais, LineItem, BunchItem } from './types';

type GeneratorProps = {
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
  carguera: Carguera | null;
  pais: Pais | null;
};

// Helper function to convert image URL to data URL
const toDataURL = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export async function generateInvoicePdf({ invoice, customer, carguera, pais }: GeneratorProps): Promise<TDocumentDefinitions> {
    const logoUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/logo.png`
      : 'https://placehold.co/200x60.png';

    const logoDataUrl = await toDataURL(logoUrl);

    let totalBoxes = 0;
    let totalStems = 0;
    let totalBunches = 0;
    let totalFob = 0;

    const tableBody = [
        ['CAJAS', 'TIPO DE CAJA', 'NOMBRE DE LA FLOR', 'VARIEDAD', 'COLOR', 'LONGITUD', 'TALLOS POR CAJA', 'BUNCHES POR CAJA', 'PRECIO DE VENTA', 'TOTAL'].map(h => ({ text: h, style: 'tableHeader' }))
    ];

    invoice.items.forEach(item => {
        totalBoxes += item.boxNumber;
        item.bunches.forEach(bunch => {
            const stemsInBunch = (Number(bunch.stemsPerBunch) || 0) * (Number(bunch.bunches) || 0);
            const totalPrice = stemsInBunch * (Number(bunch.salePrice) || 0);
            totalStems += stemsInBunch;
            totalBunches += (Number(bunch.bunches) || 0);
            totalFob += totalPrice;

            tableBody.push([
                { text: item.boxNumber.toString(), style: 'tableCell' },
                { text: item.boxType.toUpperCase(), style: 'tableCell' },
                { text: bunch.product, style: 'tableCell', alignment: 'left' },
                { text: bunch.variety, style: 'tableCell', alignment: 'left' },
                { text: bunch.color, style: 'tableCell', alignment: 'left' },
                { text: bunch.length.toString(), style: 'tableCell' },
                { text: stemsInBunch.toString(), style: 'tableCell' },
                { text: bunch.bunches.toString(), style: 'tableCell' },
                { text: (bunch.salePrice || 0).toFixed(3), style: 'tableCell', alignment: 'right' },
                { text: `$${totalPrice.toFixed(2)}`, style: 'tableCell', alignment: 'right', bold: true },
            ]);
        });
    });

    const docDefinition: TDocumentDefinitions = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        defaultStyle: {
            font: 'Helvetica',
            fontSize: 8,
        },
        styles: {
            header: {
                fontSize: 20,
                bold: true,
                alignment: 'right',
                margin: [0, 0, 0, 20],
            },
            subheader: {
                fontSize: 10,
                bold: true,
            },
            tableHeader: {
                bold: true,
                fontSize: 7,
                color: 'black',
                fillColor: '#e0e0e0',
                alignment: 'center',
            },
            tableCell: {
                fontSize: 7,
                alignment: 'center',
            },
            infoBox: {
                fontSize: 8,
            },
            totalLabel: {
                bold: true,
                fontSize: 9,
                alignment: 'right',
            },
            totalValue: {
                bold: true,
                fontSize: 9,
                alignment: 'right',
            }
        },
        content: [
            // Header
            {
                columns: [
                    {
                        stack: [
                            {
                                image: logoDataUrl as string,
                                width: 150,
                            },
                            {
                                table: {
                                    widths: ['*'],
                                    body: [
                                        [{ text: `E-MAIL: jcwf@outlook.es`, style: 'infoBox' }],
                                        [{ text: `PHONE: +593 096 744 1343`, style: 'infoBox' }],
                                        [{ text: `ADDRESS: Pasaje F y Calle Quito, EL QUINCHE - QUITO - ECUADOR`, style: 'infoBox' }],
                                    ],
                                },
                                layout: 'lightHorizontalLines',
                                margin: [0, 10, 0, 0],
                            },
                        ],
                    },
                    {
                        stack: [
                            { text: 'INVOICE', style: 'header' },
                            {
                                table: {
                                    widths: [50, '*'],
                                    body: [
                                        [{ text: 'DATE:', style: 'subheader' }, { text: format(parseISO(invoice.flightDate), 'MM/dd/yyyy'), alignment: 'center' }],
                                        [{ text: 'No.', style: 'subheader' }, { text: invoice.invoiceNumber, bold: true, fontSize: 12, alignment: 'center' }],
                                    ]
                                },
                                layout: { hLineWidth: () => 1, vLineWidth: () => 1 },
                                margin: [0, 0, 0, 10],
                            },
                            {
                                table: {
                                    widths: [50, '*'],
                                    body: [
                                        [{ text: 'AWB:', style: 'subheader' }, { text: invoice.masterAWB, alignment: 'center' }],
                                        [{ text: 'HAWB:', style: 'subheader' }, { text: invoice.houseAWB, alignment: 'center' }],
                                    ]
                                },
                                layout: { hLineWidth: () => 1, vLineWidth: () => 1 },
                            },
                        ],
                        width: 'auto',
                    }
                ],
            },
            // Client Info
            {
                table: {
                    widths: ['auto', '*', 'auto', '*'],
                    body: [
                        [{ text: 'Name Client:', bold: true }, customer?.name || '', { text: 'Mark:', bold: true }, invoice.reference || ''],
                        [{ text: 'Agency:', bold: true }, carguera?.nombreCarguera || '', { text: 'Address:', bold: true }, customer?.address || ''],
                        [{ text: 'Country:', bold: true }, pais?.nombre || '', {}, {}],
                    ]
                },
                layout: 'lightHorizontalLines',
                margin: [0, 20, 0, 10],
            },
            // Items Table
            {
                table: {
                    headerRows: 1,
                    widths: ['auto', 'auto', '*', '*', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                    body: tableBody,
                },
                layout: 'lightHorizontalLines',
            },
             // Totals Row
            {
                table: {
                    headerRows: 0,
                    widths: ['auto', 'auto', '*', '*', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                     body: [
                        [
                           { text: totalBoxes, bold: true, alignment: 'center' },
                           { text: 'TOTALES', colSpan: 5, bold: true, alignment: 'center' }, {}, {}, {}, {},
                           { text: totalStems, bold: true, alignment: 'center' },
                           { text: totalBunches, bold: true, alignment: 'center' },
                           {}, {}
                        ]
                    ]
                },
                 layout: 'lightHorizontalLines',
            },

            // Footer
            {
                columns: [
                    {
                        text: 'All prices are FOB Quito. Please remember that you have 10 days after the date on the invoice to make a claim and that we do not accept credits for freight or handling charges in any case.',
                        style: 'infoBox',
                        width: '*'
                    },
                    {
                        width: 'auto',
                        table: {
                            widths: ['*', '*'],
                            body: [
                                [{ text: 'TOTAL FOB', style: 'totalLabel', border: [true, true, false, true] }, { text: `$${totalFob.toFixed(2)}`, style: 'totalValue', border: [false, true, true, true] }],
                            ]
                        },
                         layout: { defaultBorder: false },
                    }
                ],
                margin: [0, 20, 0, 0]
            }
        ]
    };

    return docDefinition;
}
