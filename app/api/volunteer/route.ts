import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resend, ResendError } from '@/lib/newsletter';
import { createVolunteerPdf, type AgreementBlock } from '@/lib/volunteer-pdf';
import {
  acceptanceStatement,
  agreementSections,
  agreementVersion,
  volunteerContact,
  volunteerDeclarations,
  volunteerLogo,
  volunteerPrivacyNotice,
} from '@/lib/volunteer-agreement';

export const runtime = 'nodejs';

const submission = z.object({
  name: z.string().trim().min(1).max(120).regex(/^[^\p{Cc}<>]+$/u),
  email: z.string().trim().max(254).email(),
  accepted: z.literal(true),
  declarations: z.object({
    transport: z.literal(true),
    workRights: z.literal(true),
    authorisation: z.literal(true),
    driving: z.boolean(),
    validLicence: z.boolean(),
  }).refine(({ driving, validLicence }) => driving === validLicence),
  version: z.string(),
  website: z.literal(''),
});

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return fail('Submit the agreement from the Webfit News volunteer page.', 403);
  }
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
    return fail('Reload the volunteer page and try again.', 415);
  }

  const body = await request.text();
  if (body.length > 4096) return fail('The submission is too large.', 413);

  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return fail('The submission could not be read. Please try again.', 400);
  }

  const submittedVersion = z.object({ version: z.string() }).safeParse(input);
  if (submittedVersion.success && submittedVersion.data.version !== agreementVersion) {
    return fail('The agreement has changed. Reload the page and read the current version before signing.', 409);
  }

  const result = submission.safeParse(input);
  if (!result.success) return fail('Enter your full name and a valid email address, then complete all required declarations and accept the agreement.', 422);

  const { name, email, version, declarations } = result.data;

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return fail('Online signing is temporarily unavailable. Please try again later.', 503);

  const inbox = process.env.VOLUNTEER_NDA_INBOX?.trim() || volunteerContact;
  const from = process.env.NEWSROOM_EMAIL_FROM?.trim() || 'Webfit Newsroom <newsroom@webfitnews.com>';
  // Stable across retries. The emails carry the full signed text, and the provider stamps the send time.
  const reference = createHmac('sha256', key).update(JSON.stringify([version, name, email, declarations.driving])).digest('hex').slice(0, 24);
  const blocks: AgreementBlock[] = [
    {
      title: 'Electronic acceptance',
      paragraphs: [`Signed electronically by ${name}`, `Email address: ${email}`, acceptanceStatement],
    },
    {
      title: 'Volunteer declarations',
      paragraphs: [
        volunteerDeclarations.transport,
        volunteerDeclarations.workRights,
        volunteerDeclarations.authorisation,
        declarations.driving ? volunteerDeclarations.driving : 'Driving declaration: no plan to drive a personal vehicle was declared at signing.',
      ],
    },
    ...agreementSections,
    { title: 'How we use your details', paragraphs: [volunteerPrivacyNotice, `Contact: ${volunteerContact}`] },
  ];

  try {
    const pdf = await createVolunteerPdf(version, reference, blocks);
    const attachments = [{
      filename: `Webfit-News-Signed-Volunteer-Agreement-${reference}.pdf`,
      content: Buffer.from(pdf).toString('base64'),
      content_type: 'application/pdf',
    }];

    async function sendReceipt(kind: 'volunteer' | 'newsroom', to: string, replyTo: string, subject: string, message: string) {
      const text = `Webfit News Volunteer Media Agreement and NDA\n\n${message}\n\nReference: ${reference}`;
      const html = `<div style="max-width:560px;margin:0 auto;font:16px/1.55 Arial,sans-serif;color:#152331">
        <div style="padding:20px;background:#122333;border-bottom:4px solid #ebbd5f;color:#fff">
          <img src="https://webfitnews.com${volunteerLogo}" width="64" height="64" alt="Webfit News" style="border-radius:50%;display:block;margin-bottom:12px">
          <strong style="color:#ebbd5f">WEBFIT NEWS</strong>
          <h1 style="font:700 25px/1.2 Georgia,serif;margin:6px 0 0">Volunteer Media Agreement and NDA</h1>
        </div>
        <div style="padding:20px;border:1px solid #dbe2e8">
          <p style="margin:0 0 12px">${message}</p>
          <p style="margin:0">Reference <strong>${reference}</strong></p>
        </div>
      </div>`;
      const delivery = await resend<{ id?: string }>('/emails', {
        method: 'POST',
        idempotencyKey: `volunteer-nda/pdf/${reference}/${kind}`,
        body: { from, to: [to], reply_to: replyTo, subject, text, html, attachments },
      });
      if (!delivery?.id) throw new Error('Resend did not return a message ID');
      console.info('[volunteer] Resend accepted agreement email', { reference, kind, emailId: delivery.id });
    }

    const deliveries = await Promise.allSettled([
      sendReceipt('volunteer', email, inbox, 'Your signed Webfit News volunteer agreement',
        'Thank you for signing. Your signed agreement is attached as a PDF. Keep it for your records and wait for separate written authorisation before attending an event on behalf of Webfit News.'),
      sendReceipt('newsroom', inbox, email, 'Webfit News volunteer agreement accepted',
        'A volunteer has signed the agreement. The signed PDF is attached. Send a separate written authorisation for each approved event.'),
    ]);
    for (const delivery of deliveries) {
      if (delivery.status === 'rejected') throw delivery.reason;
    }
    return NextResponse.json({ reference });
  } catch (error) {
    console.error('[volunteer] Resend did not confirm the agreement emails', {
      reference,
      providerStatus: error instanceof ResendError ? error.status : undefined,
    });
    return fail('We could not confirm your submission. Please try again using the same name and email.', 502);
  }
}
