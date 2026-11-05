import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resend, ResendError } from '@/lib/newsletter';
import {
  acceptanceStatement,
  agreementSections,
  agreementVersion,
  volunteerContact,
  volunteerDeclarations,
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
  const signedCopy = [
    `Webfit News Volunteer Media Agreement and NDA (version ${version})`,
    `Reference: ${reference}`,
    `Signed electronically by: ${name}`,
    `Email: ${email}`,
    acceptanceStatement,
    [
      'Volunteer declarations accepted',
      volunteerDeclarations.transport,
      volunteerDeclarations.workRights,
      volunteerDeclarations.authorisation,
      declarations.driving ? volunteerDeclarations.driving : 'Driving declaration: no plan to drive a personal vehicle was declared at signing.',
    ].join('\n'),
    ...agreementSections.map(({ title, paragraphs }) => [title, ...paragraphs].join('\n\n')),
    `How we use your details\n\n${volunteerPrivacyNotice} Contact: ${volunteerContact}`,
  ].join('\n\n');

  try {
    const delivery = await resend<{ data?: Array<{ id: string }> }>('/emails/batch', {
      method: 'POST',
      idempotencyKey: `volunteer-nda/${reference}`,
      body: [
        {
          from,
          to: [email],
          reply_to: inbox,
          subject: 'Your signed Webfit News volunteer agreement',
          text: `Thank you for signing. Keep this copy for your records. Wait for a separate written authorisation before attending an event on behalf of Webfit News.\n\n${signedCopy}`,
        },
        {
          from,
          to: [inbox],
          reply_to: email,
          subject: 'Webfit News volunteer agreement accepted',
          text: `A volunteer has signed the agreement. Send a separate authorisation email for any approved assignment.\n\n${signedCopy}`,
        },
      ],
    });
    if (delivery?.data?.length !== 2 || delivery.data.some(email => !email?.id)) {
      throw new Error('Expected two email IDs');
    }
    console.info('[volunteer] Resend accepted agreement emails', {
      reference,
      volunteerEmailId: delivery.data[0].id,
      newsroomEmailId: delivery.data[1].id,
    });
    return NextResponse.json({ reference });
  } catch (error) {
    console.error('[volunteer] Resend did not confirm the agreement emails', {
      reference,
      providerStatus: error instanceof ResendError ? error.status : undefined,
    });
    return fail('We could not confirm your submission. Please try again using the same name and email.', 502);
  }
}
