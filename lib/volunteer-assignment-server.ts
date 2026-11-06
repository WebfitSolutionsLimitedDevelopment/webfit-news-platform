import 'server-only';
import { NextResponse } from 'next/server';
import { isReviewerRole } from './admin-auth';
import { createClient } from './supabase-server';
import { createAdminClient } from './supabase-admin';
import { createVolunteerPdf } from './volunteer-pdf';
import { absoluteUrl } from './site';
import { resend } from './newsletter';
import type { Assignment } from './volunteer-assignments';

export const assignmentBucket = 'volunteer-assignments';

export async function assignmentSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('display_name,role,is_active').eq('id', user.id).maybeSingle();
  if (!profile?.is_active || (!isReviewerRole(profile.role) && profile.role !== 'volunteer')) return null;
  return { user, profile, reviewer: isReviewerRole(profile.role), admin: createAdminClient() };
}

export async function findAssignment(session: NonNullable<Awaited<ReturnType<typeof assignmentSession>>>, id: string) {
  let query = session.admin.from('volunteer_assignments').select('*').eq('id', id);
  if (!session.reviewer) query = query.eq('volunteer_id', session.user.id).neq('status', 'draft');
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as Assignment | null;
}

export function assignmentError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export function isAssignmentMutation(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}

export function assignmentLetterName(id: string) {
  return `Webfit-News-Authorisation-${id}.pdf`;
}

export function assignmentLetter(assignment: Assignment) {
  const accepted = new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Pacific/Auckland',
  }).format(new Date(assignment.accepted_at!));
  const eventDate = new Intl.DateTimeFormat('en-NZ', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(assignment.event_date));
  return createVolunteerPdf('1', assignment.id, [
    { title: 'Authorised volunteer', paragraphs: [
      `Webfit News authorises ${assignment.volunteer_name} to represent Webfit News as a media volunteer for the assignment described below.`,
      `Accepted by the volunteer on ${accepted} (New Zealand time).`,
      `Assignment reference: ${assignment.id}`,
    ] },
    { title: 'Assignment details', paragraphs: [
      assignment.title,
      `Date: ${eventDate}${assignment.event_time ? ` | Time: ${assignment.event_time} (New Zealand local time)` : ''}`,
      `Location: ${assignment.venue}`,
    ] },
    { title: 'Scope of authorisation', paragraphs: [
      'This authorisation applies only to this assignment. Follow the organiser’s accreditation, access, safety and recording requirements. Submit your written report and any relevant photos through the Webfit News CMS after the assignment.',
      `Issued by ${assignment.issuer_name}, Webfit News. To verify this letter, contact webfitnews@gmail.com.`,
    ] },
  ], { title: 'Volunteer Authorisation Letter', kicker: 'WEBFIT NEWS  /  MEDIA ASSIGNMENT', subtitle: 'Assignment authorisation' });
}

export async function emailAssignmentLetter(assignment: Assignment, email: string) {
  const bytes = await assignmentLetter(assignment);
  await resend('/emails', {
    method: 'POST',
    idempotencyKey: `volunteer-authorisation/${assignment.id}`,
    body: {
      from: process.env.NEWSROOM_EMAIL_FROM?.trim() || 'Webfit Newsroom <newsroom@webfitnews.com>',
      to: [email],
      subject: 'Your Webfit News assignment authorisation',
      text: `Thank you for accepting ${assignment.title}. Your authorisation letter is attached. After the event, submit your report and photos at ${absoluteUrl('/admin/assignments')}.`,
      attachments: [{ filename: assignmentLetterName(assignment.id), content: Buffer.from(bytes).toString('base64'), content_type: 'application/pdf' }],
    },
  });
}
