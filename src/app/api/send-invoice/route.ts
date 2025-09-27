// This API route is now mocked for the demo version.
// It no longer sends real emails.

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject } = body;

    // Basic validation
    if (!to || !subject) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    // Simulate a successful email send without actually sending one.
    console.log(`[DEMO MODE] Simulating email send to: ${to} with subject: "${subject}"`);
    
    // Simulate a short delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({ message: 'Email sent successfully! (Demo)' }, { status: 200 });

  } catch (error) {
    console.error('Error in mocked send-invoice API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Failed to process request: ${errorMessage}` }, { status: 500 });
  }
}
