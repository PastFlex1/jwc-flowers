import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface Attachment {
  filename: string;
  content: string; // base64 encoded string
}

export async function sendEmailWithAttachments({
  to,
  subject,
  body,
  attachments,
}: {
  to: string;
  subject: string;
  body: string;
  attachments: Attachment[];
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Resend API key is not configured.');
  }

  try {
    const data = await resend.emails.send({
      from: 'JCW Flowers <onboarding@resend.dev>', // You must verify your domain on Resend to use a custom from address
      to: [to],
      subject: subject,
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content,
      })),
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    return { success: false, error };
  }
}
