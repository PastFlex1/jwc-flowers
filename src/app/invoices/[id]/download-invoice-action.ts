'use server';

// This is a server-side action to fetch PDF data from the API route.
// It does NOT do any rendering itself.
export async function downloadInvoiceAction(invoiceId: string): Promise<{ success: boolean; pdf?: string; invoiceNumber?: string; error?: string }> {
  if (!invoiceId) {
    return { success: false, error: 'Invoice ID is required' };
  }

  try {
    // In a real app, use environment variables for the base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    
    const response = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoiceId }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    const { pdf, invoiceNumber } = await response.json();

    return { success: true, pdf, invoiceNumber };

  } catch (error) {
    console.error('Error in downloadInvoiceAction:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: `Failed to generate PDF: ${errorMessage}` };
  }
}
