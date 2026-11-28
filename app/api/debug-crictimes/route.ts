// TEMPORARY (preview only): read the CricTimes widget's own files to find its settings.
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get('u') || 'https://cwidget.crictimes.org/?v=1.1';
  const target = new URL(u);
  if (!/(^|\.)crictimes\.org$/.test(target.hostname)) return new Response('no', { status: 400 });
  const r = await fetch(target, { cache: 'no-store', headers: { 'user-agent': 'Mozilla/5.0' } });
  return new Response(await r.text(), { headers: { 'content-type': 'text/plain; charset=utf-8', 'x-status': String(r.status) } });
}
