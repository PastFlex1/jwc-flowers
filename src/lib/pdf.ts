import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// This function generates a PDF from an HTML string using Puppeteer.
// It's designed to run in a serverless environment.
export async function generatePdfFromHtml(htmlContent: string): Promise<string> {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    
    // Set the content of the page
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    return pdfBuffer.toString('base64');
  } catch (error) {
    console.error('Error generating PDF with Puppeteer:', error);
    throw new Error('Could not generate PDF.');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
