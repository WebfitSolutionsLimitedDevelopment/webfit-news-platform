import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assignmentError, assignmentSession, isAssignmentMutation } from '@/lib/volunteer-assignment-server';

const input = z.object({
  volunteer_id: z.string().uuid(),
  title: z.string().trim().min(3).max(150),
  venue: z.string().trim().min(2).max(300),
  event_date: z.string().date(),
  event_time: z.string().trim().max(100),
  contact: z.string().trim().max(250),
  instructions: z.string().trim().min(3).max(6000),
});

export async function POST(request: Request) {
  if (!isAssignmentMutation(request)) return assignmentError('Invalid request origin.', 403);
  const session = await assignmentSession();
  if (!session?.reviewer) return assignmentError('Editor access is required.', 403);
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return assignmentError('Choose a volunteer and enter the task, date, venue and instructions.', 422);

  const { data: volunteer } = await session.admin.from('profiles').select('display_name,email')
    .eq('id', parsed.data.volunteer_id).eq('role', 'volunteer').eq('is_active', true).maybeSingle();
  if (!volunteer) return assignmentError('Choose an active volunteer account.', 422);
  const { data, error } = await session.admin.from('volunteer_assignments').insert({
    ...parsed.data,
    event_time: parsed.data.event_time || null,
    contact: parsed.data.contact || null,
    assigned_by: session.user.id,
    volunteer_name: volunteer.display_name || volunteer.email || 'Webfit News volunteer',
    issuer_name: session.profile.display_name || 'Webfit News editorial team',
  }).select('id').single();
  if (error) return assignmentError('Could not create the assignment.', 500);
  return NextResponse.json(data, { status: 201 });
}
