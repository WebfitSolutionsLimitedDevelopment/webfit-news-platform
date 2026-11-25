import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { getEdition, isEditionKey, type Edition } from '@/lib/epaper';
import { resizedImage } from '@/lib/image-url';
import { absoluteUrl } from '@/lib/site';

/*
 * The picture WhatsApp, Facebook and others show when someone shares an e-paper link:
 * a miniature of the front page (masthead, lead story and photo, teasers, front-page ads)
 * beside "No. 14 · Thursday, 26 November 2026". 1200x630 JPEG, built per edition and cached.
 * /epaper/share-card/<edition date> or /epaper/share-card/latest.
 */

export const revalidate = 3600;

const NAVY = '#1f2a6b', RED = '#c8232c', GOLD = '#f1c34a', INK = '#151515';

async function font(file: string) {
  try { return await readFile(join(process.cwd(), 'public/fonts/og', file)); } catch {}
  try { const r = await fetch(absoluteUrl(`/fonts/og/${file}`)); if (r.ok) return Buffer.from(await r.arrayBuffer()); } catch {}
  return null;
}

/** Fetch a picture and hand it to the renderer as a small JPEG; null if it can't be loaded (never breaks the card). */
async function picture(url: string | null | undefined, width: number) {
  if (!url) return null;
  try {
    const src = url.startsWith('/') ? absoluteUrl(url) : url;
    const res = await fetch(resizedImage(src, width * 2, 80), { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const img = sharp(Buffer.from(await res.arrayBuffer())).rotate().resize({ width: width * 2, withoutEnlargement: true });
    // PNGs (the logo badge) stay PNG so their transparent corners survive; photos become small JPEGs.
    if (/\.png($|\?)/i.test(url)) return `data:image/png;base64,${(await img.png().toBuffer()).toString('base64')}`;
    return `data:image/jpeg;base64,${(await img.jpeg({ quality: 80 }).toBuffer()).toString('base64')}`;
  } catch { return null; }
}

const clip = (t: string, n: number) => (t.length <= n ? t : `${t.slice(0, t.lastIndexOf(' ', n - 1))}…`);

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (key !== 'latest' && !isEditionKey(key)) return new Response('Not found', { status: 404 });
  const edition: Edition | null = await getEdition(key === 'latest' ? undefined : key);
  if (!edition) return new Response('Not found', { status: 404 });

  const lead = edition.sections[0]?.stories[0];
  const leadText = (lead?.blocks || []).filter(b => b.k === 'p' && !/^Read the full story/.test(b.t)).map(b => b.t).join(' ');
  const teasers = (edition.front?.teasers || []).slice(0, 3);
  // The front page's poster column: business posters first (never election ads), as on page 1.
  const posters = [...edition.sharedPageAds, ...edition.fullPageAds].filter(a => !a.isElectionAd).slice(0, 3);

  const [oswald, roboto, robotoBold, playfair, playfairItalic, globe, leadPic, ...posterPics] = await Promise.all([
    font('oswald-600.ttf'), font('roboto-400.ttf'), font('roboto-700.ttf'), font('playfair-800.ttf'), font('playfair-800-italic.ttf'),
    picture('/webfit-news-badge-240.png', 34), picture(lead?.image, 300), ...posters.map(p => picture(p.image, 100)),
  ]);
  const fonts = [
    oswald && { name: 'Head', data: oswald, weight: 600 as const, style: 'normal' as const },
    roboto && { name: 'Body', data: roboto, weight: 400 as const, style: 'normal' as const },
    robotoBold && { name: 'Body', data: robotoBold, weight: 700 as const, style: 'normal' as const },
    playfair && { name: 'Display', data: playfair, weight: 800 as const, style: 'normal' as const },
    playfairItalic && { name: 'Display', data: playfairItalic, weight: 800 as const, style: 'italic' as const },
  ].filter(Boolean) as Array<{ name: string; data: Buffer; weight: 400 | 600 | 700 | 800; style: 'normal' | 'italic' }>;

  const status = edition.released ? 'This week’s paper is out' : 'Preview edition';
  const card = (
    <div style={{ width: 1200, height: 630, display: 'flex', background: `linear-gradient(135deg, ${NAVY} 0%, #141b47 100%)`, fontFamily: 'Body' }}>
      {/* Miniature front page */}
      <div style={{ position: 'absolute', left: 52, top: 26, width: 430, height: 578, display: 'flex', flexDirection: 'column', background: '#fff', padding: 12, boxShadow: '0 20px 50px rgba(0,0,0,.45)', transform: 'rotate(-1.5deg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, fontWeight: 700, letterSpacing: 1, color: '#3a3732', borderBottom: `1px solid ${INK}`, paddingBottom: 4 }}>
          <span>{edition.dateline.toUpperCase()}</span><span style={{ color: RED }}>WEEKLY · EVERY THURSDAY</span><span>NO. {edition.number} · FREE</span>
        </div>
        <div style={{ display: 'flex', marginTop: 7, gap: 7, flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 300, gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: NAVY, borderRadius: 3, padding: '7px 9px' }}>
              {globe ? <img src={globe} width={34} height={34} style={{ width: 34, height: 34 }}/> : null}
              <div style={{ display: 'flex', fontFamily: 'Display', fontWeight: 800, fontSize: 30, color: '#fff', letterSpacing: -1 }}>Webfit<span style={{ color: GOLD, fontStyle: 'italic', marginLeft: 6 }}>News</span></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, border: `1.5px solid ${NAVY}`, borderRadius: 4, padding: 7, overflow: 'hidden' }}>
              <div style={{ display: 'flex', fontFamily: 'Head', fontWeight: 600, fontSize: 18, lineHeight: 1.05, color: INK, textAlign: 'center', justifyContent: 'center' }}>{clip(lead?.title || 'This week in Webfit News', 90)}</div>
              {leadPic ? <img src={leadPic} width={284} height={170} style={{ width: 284, height: 170, objectFit: 'cover', marginTop: 6 }}/> : null}
              <div style={{ display: 'flex', fontSize: 7.5, lineHeight: 1.4, color: '#3a3732', marginTop: 6, overflow: 'hidden', flex: 1 }}>{clip(leadText, 1150)}</div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {teasers.map(t => <div key={t.slug} style={{ display: 'flex', flexDirection: 'column', flex: 1, borderTop: `2px solid ${RED}`, paddingTop: 3 }}>
                <span style={{ fontSize: 6, fontWeight: 700, color: RED, letterSpacing: .5 }}>{t.section.toUpperCase()}</span>
                <span style={{ fontFamily: 'Head', fontWeight: 600, fontSize: 9, lineHeight: 1.1, color: INK }}>{clip(t.title, 60)}</span>
              </div>)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: 99, gap: 5 }}>
            {posterPics.map((p, i) => p ? <img key={i} src={p} width={99} height={150} style={{ width: 99, height: 150, objectFit: 'contain', border: `1px solid ${INK}`, background: '#f4f2ee' }}/> : null)}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1.5px solid ${RED}`, borderRadius: 3, padding: 4, marginTop: 'auto' }}>
              <span style={{ fontFamily: 'Head', fontWeight: 600, fontSize: 9, color: RED }}>Your business here</span>
            </div>
          </div>
        </div>
      </div>
      {/* The words beside it */}
      <div style={{ position: 'absolute', left: 540, top: 54, width: 610, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4, color: GOLD }}>WEBFIT NEWS · WEEKLY E-PAPER</span>
        <span style={{ fontFamily: 'Display', fontWeight: 800, fontSize: 58, lineHeight: 1.04, color: '#fff', marginTop: 14 }}>{status}</span>
        <span style={{ fontFamily: 'Head', fontWeight: 600, fontSize: 30, color: '#dfe5f5', marginTop: 14 }}>No. {edition.number} · {edition.dateline}</span>
        <div style={{ display: 'flex', height: 3, width: 90, background: RED, marginTop: 26 }}/>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3, color: '#aab3d6', marginTop: 22 }}>THIS WEEK’S LEAD</span>
        <span style={{ fontFamily: 'Head', fontWeight: 600, fontSize: 32, lineHeight: 1.12, color: '#fff', marginTop: 8 }}>{clip(lead?.title || '', 110)}</span>
      </div>
      <div style={{ position: 'absolute', left: 540, bottom: 44, width: 620, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ display: 'flex', background: GOLD, color: '#141b47', borderRadius: 999, padding: '12px 26px', fontSize: 24, fontWeight: 700 }}>Read it free · webfitnews.com/epaper</span>
        <span style={{ fontSize: 20, color: '#aab3d6' }}>{edition.storyCount} stories · 21 pages</span>
      </div>
    </div>
  );

  const png = await new ImageResponse(card, { width: 1200, height: 630, fonts: fonts.length ? fonts : undefined }).arrayBuffer();
  // JPEG keeps it well under WhatsApp's size limit for a large preview.
  const jpg = await sharp(Buffer.from(png)).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400' } });
}
