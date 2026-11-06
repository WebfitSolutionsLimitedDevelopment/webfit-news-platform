import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assignmentAttachmentMaxBytes, canAddBriefingAttachments } from '@/lib/volunteer-assignments';
import { readImageSize } from '@/lib/image-dimensions';
import {
  assignmentBucket, assignmentError, assignmentLetter, assignmentLetterName, assignmentSession,
  emailAssignmentLetter, findAssignment, isAssignmentMutation,
} from '@/lib/volunteer-assignment-server';

type Context = { params: Promise<{ id: string }> };
const uuid = z.string().uuid();
const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const briefingTypesByExtension: Record<string, string> = {
  pdf: 'application/pdf',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const briefingTypes = Object.values(briefingTypesByExtension);
const command = z.discriminatedUnion('action', [
  z.object({ action: z.literal('offer') }),
  z.object({ action: z.literal('accept') }),
  z.object({ action: z.literal('decline'), note: z.string().trim().max(1000).default('') }),
  z.object({ action: z.literal('report'), text: z.string().trim().min(1).max(20000) }),
  z.object({ action: z.literal('complete') }),
]);

export async function GET(request: Request, context: Context) {
  const session = await assignmentSession();
  if (!session) return assignmentError('Sign in to the newsroom.', 401);
  const { id } = await context.params;
  const assignment = uuid.safeParse(id).success ? await findAssignment(session, id) : null;
  if (!assignment) return assignmentError('Assignment not found.', 404);
  const query = new URL(request.url).searchParams;
  const fileId = query.get('file');
  if (fileId && uuid.safeParse(fileId).success) {
    const { data: file } = await session.admin.from('volunteer_assignment_files').select('object_path,filename,kind,content_type')
      .eq('id', fileId).eq('assignment_id', id).maybeSingle();
    if (!file || (file.kind === 'report' && assignment.status === 'complete')) return assignmentError('Attachment not found.', 404);
    const preview = query.get('preview') === '1' && imageTypes.includes(file.content_type);
    const { data, error } = await session.admin.storage.from(assignmentBucket).createSignedUrl(file.object_path, 60,
      preview ? undefined : { download: file.filename });
    if (error || !data) return assignmentError('Attachment unavailable.', 404);
    return new Response(null, { status: 302, headers: { Location: data.signedUrl, 'Cache-Control': 'private, no-store' } });
  }
  if (query.has('letter') && assignment.accepted_at) {
    const pdf = await assignmentLetter(assignment);
    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${assignmentLetterName(id)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  }
  return assignmentError('File not found.', 404);
}

export async function POST(request: Request, context: Context) {
  if (!isAssignmentMutation(request)) return assignmentError('Invalid request origin.', 403);
  const session = await assignmentSession();
  if (!session) return assignmentError('Sign in to the newsroom.', 401);
  const { id } = await context.params;
  const assignment = uuid.safeParse(id).success ? await findAssignment(session, id) : null;
  if (!assignment) return assignmentError('Assignment not found.', 404);
  const bucket = session.admin.storage.from(assignmentBucket);

  if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
    const kind = session.reviewer ? 'briefing' : 'report';
    if (!(kind === 'briefing' ? canAddBriefingAttachments(assignment.status) : assignment.status === 'accepted')) {
      return assignmentError('This assignment is no longer open for uploads.', 409);
    }
    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    const extension = file instanceof File ? file.name.toLowerCase().split('.').at(-1) || '' : '';
    const contentType = file instanceof File
      ? (kind === 'briefing' && (!file.type || file.type === 'application/octet-stream') && Object.hasOwn(briefingTypesByExtension, extension)
        ? briefingTypesByExtension[extension] : file.type)
      : '';
    if (file instanceof File && file.size > assignmentAttachmentMaxBytes) {
      return assignmentError('The file exceeds 4 MB. Reduce the file size and try again.', 413);
    }
    if (!(file instanceof File) || file.size < 1 ||
        !(kind === 'report' ? imageTypes : briefingTypes).includes(contentType)) {
      return assignmentError(kind === 'report' ? 'Choose a JPEG, PNG or WebP image up to 4 MB.' : 'Choose a PDF, Word document, text file or supported image up to 4 MB.', 422);
    }
    if (imageTypes.includes(contentType) && !readImageSize(await file.slice(0, 256 * 1024).arrayBuffer())) {
      return assignmentError('The image could not be read.', 422);
    }
    const fileId = crypto.randomUUID();
    const path = `${id}/${kind}/${fileId}`;
    const { error: uploadError } = await bucket.upload(path, file, { contentType, cacheControl: '0', upsert: false });
    if (uploadError) {
      console.error('[assignments] Attachment storage upload failed', {
        id, kind, bytes: file.size, contentType, error: uploadError.message,
      });
      return assignmentError('Storage could not save the attachment. Please try uploading it again.', 502);
    }
    const filename = file.name.replace(/[\x00-\x1F\x7F/\\]/g, '_').slice(0, 180) || 'attachment';
    const { error: insertError } = await session.admin.from('volunteer_assignment_files').insert({
      id: fileId, assignment_id: id, kind, object_path: path, filename, content_type: contentType,
    });
    if (insertError) {
      const { error } = await bucket.remove([path]);
      if (error) console.error('[assignments] Failed to roll back upload', { id, fileId });
      return assignmentError('The assignment closed for uploads or reached its attachment limit.', 409);
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = command.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return assignmentError('Check the assignment action and details.', 422);
  const action = parsed.data;
  if (session.reviewer !== (action.action === 'offer' || action.action === 'complete')) {
    return assignmentError('You cannot take this action.', 403);
  }

  async function transition(expected: string, patch: Record<string, unknown>) {
    let query = session!.admin.from('volunteer_assignments').update(patch).eq('id', id).eq('status', expected);
    if (!session!.reviewer) query = query.eq('volunteer_id', session!.user.id);
    const { data, error } = await query.select('*').maybeSingle();
    if (error) throw error;
    return data;
  }

  const now = new Date().toISOString();
  switch (action.action) {
    case 'offer': {
      const { data: eligible } = await session.admin.from('profiles').select('id').eq('id', assignment.volunteer_id)
        .eq('role', 'volunteer').eq('is_active', true).maybeSingle();
      if (!eligible) return assignmentError('This volunteer account is no longer active.', 409);
      if (await transition('draft', { status: 'offered' })) return NextResponse.json({ ok: true });
      break;
    }
    case 'accept': {
      const accepted = assignment.status === 'accepted' ? assignment : await transition('offered', { status: 'accepted', accepted_at: now });
      if (!accepted) break;
      try {
        if (!session.user.email) throw new Error('No email');
        await emailAssignmentLetter(accepted, session.user.email);
        return NextResponse.json({ ok: true });
      } catch {
        return NextResponse.json({ ok: true, notice: 'Accepted. Email delivery could not be confirmed. Download your authorisation letter here.' });
      }
    }
    case 'decline':
      if (await transition('offered', { status: 'declined', response_note: action.note || null })) return NextResponse.json({ ok: true });
      break;
    case 'report':
      if (await transition('accepted', { status: 'reported', report_text: action.text, reported_at: now })) return NextResponse.json({ ok: true });
      break;
    case 'complete': {
      if (assignment.status !== 'complete' && !await transition('reported', { status: 'complete', completed_at: now })) break;
      if (assignment.photos_purged_at) return NextResponse.json({ ok: true });
      const { data: files, error: readError } = await session.admin.from('volunteer_assignment_files').select('id,object_path')
        .eq('assignment_id', id).eq('kind', 'report');
      if (readError) return assignmentError('Task completed, but photo cleanup needs a retry.', 500);
      if (files.length) {
        const { error: storageError } = await bucket.remove(files.map(file => file.object_path));
        if (storageError) return assignmentError('Task completed, but photo cleanup needs a retry.', 500);
        const { error: deleteError } = await session.admin.from('volunteer_assignment_files').delete()
          .eq('assignment_id', id).eq('kind', 'report').in('id', files.map(file => file.id));
        if (deleteError) return assignmentError('Task completed, but photo cleanup needs a retry.', 500);
      }
      const { error } = await session.admin.from('volunteer_assignments').update({ photos_purged_at: now }).eq('id', id).eq('status', 'complete');
      if (error) return assignmentError('Task completed, but photo cleanup needs a retry.', 500);
      return NextResponse.json({ ok: true });
    }
  }
  return assignmentError('The assignment status has changed. Refresh and try again.', 409);
}
