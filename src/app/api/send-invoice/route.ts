import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, attachments } = body;

    if (!process.env.RESEND_API_KEY) {
      console.error('Resend API key is not configured.');
      return NextResponse.json({ message: 'Email service is not configured.' }, { status: 500 });
    }

    if (!to || !subject || !emailBody || !attachments || !Array.isArray(attachments)) {
        return NextResponse.json({ message: 'Missing required fields in request.' }, { status: 400 });
    }

    // NOTE: For Resend sandbox, emails can only be sent TO the verified email address.
    // Hardcoding to the user's verified email for now.
    const recipient = 'jcwflowers70@gmail.com';

    await resend.emails.send({
      from: 'JCW Flowers <onboarding@resend.dev>',
      to: [recipient],
      subject: subject,
      html: `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content, // Assuming content is already base64
      })),
    });

    return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Failed to send invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Failed to process and send email: ${errorMessage}` }, { status: 500 });
  }
}
