import { createAdminClient } from './supabase-admin';
import { resend } from './newsletter';
import { absoluteUrl } from './site';

/**
 * Emails for the story review workflow. Best-effort: a failed email never
 * blocks a save, submit or publish.
 *   submitted -> every active Super Admin and Editor
 *   returned  -> the reporter, with the editor's comment
 *   published -> the reporter
 */
const FROM = process.env.NEWSROOM_EMAIL_FROM?.trim() || 'Webfit Newsroom <newsroom@webfitnews.com>';

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function page(heading: string, body: string, buttonHref: string, buttonText: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#151515">
  <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#c8232c;font-weight:700;margin:0 0 8px">Webfit Newsroom</p>
  <h1 style="font-family:Georgia,serif;font-size:22px;line-height:1.25;margin:0 0 14px">${heading}</h1>
  ${body}
  <p style="margin:22px 0"><a href="${buttonHref}" style="background:#151515;color:#fff;text-decoration:none;padding:11px 18px;border-radius:999px;font-weight:700;font-size:14px">${buttonText}</a></p>
  <p style="font-size:12px;color:#8a8478">You get this because you have a Webfit News newsroom account.</p></div>`;
}

async function send(to: string[], subject: string, html: string) {
  if (!to.length || !process.env.RESEND_API_KEY) return;
  await resend('/emails', { method: 'POST', body: { from: FROM, to, subject, html } });
}

export async function notifyReview(articleId: string, event: 'submitted' | 'returned' | 'published') {
  try {
    const admin = createAdminClient();
    const { data: a } = await admin.from('articles').select('id,title,slug,created_by,review_note,author:author_id(name)').eq('id', articleId).maybeSingle();
    if (!a) return;
    const title = esc(a.title || 'Untitled story');
    const editHref = absoluteUrl(`/admin/articles/${a.id}`);
    const reporterName = esc((a.author as any)?.name || 'A reporter');

    if (event === 'submitted') {
      const { data: reviewers } = await admin.from('profiles').select('email').eq('is_active', true).in('role', ['super_admin', 'editor']);
      await send((reviewers || []).map(r => r.email).filter(Boolean) as string[], `For review: ${a.title}`,
        page(`${reporterName} submitted a story`, `<p style="font-size:16px;line-height:1.5"><strong>${title}</strong></p><p style="font-size:15px;line-height:1.5;color:#4b4740">Open it to publish it, or send it back with a comment.</p>`, editHref, 'Review the story'));
      return;
    }
    if (!a.created_by) return;
    const { data: reporter } = await admin.from('profiles').select('email,display_name').eq('id', a.created_by).maybeSingle();
    if (!reporter?.email) return;
    if (event === 'returned') {
      const { data: last } = await admin.from('article_reviews').select('note').eq('article_id', a.id).eq('action', 'returned').order('created_at', { ascending: false }).limit(1).maybeSingle();
      const note = esc(last?.note || a.review_note || '');
      await send([reporter.email], `Changes requested: ${a.title}`,
        page('Your story needs some changes', `<p style="font-size:16px;line-height:1.5"><strong>${title}</strong></p><p style="font-size:15px;line-height:1.5">The editor's comment:</p><blockquote style="margin:0;padding:12px 14px;border-left:3px solid #c8232c;background:#fdf6f2;font-size:15px;line-height:1.5;white-space:pre-wrap">${note}</blockquote><p style="font-size:15px;line-height:1.5;color:#4b4740">Make the changes and submit it again.</p>`, editHref, 'Open my story'));
    } else {
      await send([reporter.email], `Published: ${a.title}`,
        page('Your story is live', `<p style="font-size:16px;line-height:1.5"><strong>${title}</strong></p><p style="font-size:15px;line-height:1.5;color:#4b4740">It has been approved and published on Webfit News.</p>`, absoluteUrl(`/${a.slug}`), 'Read it on Webfit News'));
    }
  } catch {
    // Email is a courtesy; never let it break the newsroom.
  }
}
