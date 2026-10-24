import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase-public';
import { resizedImage } from '@/lib/image-url';
import styles from './report.module.css';

/*
 * The advertiser's private report: https://webfitnews.com/ad-report/<report_token>.
 * Each campaign has its own secret token (ad_campaigns.report_token). The page shows that
 * campaign's totals only (ad_campaign_report), never other advertisers' data. Not indexed.
 */

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your advertising report · Webfit News', robots: { index: false, follow: false } };

type Row = { channel: string; views: number; opened: number; clicks: number };
type Week = Row & { week: string };
type Report = {
  advertiser: string; campaign: string; status: string; starts_at: string | null; ends_at: string | null; image: string | null;
  totals: Row[]; weeks: Week[]; placements: Array<{ label: string; channel: string; views: number; clicks: number }>; devices: Array<{ device: string; views: number }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const n = (x: number) => new Intl.NumberFormat('en-NZ').format(x);
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : '–');
const day = (iso: string | null) => (iso ? new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Pacific/Auckland' }).format(new Date(iso)) : null);
const weekLabel = (ymd: string) => new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${ymd}T12:00:00Z`));

export default async function AdReport({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!UUID.test(token)) notFound();
  const supabase = await createPublicClient();
  const { data } = await supabase.rpc('ad_campaign_report', { p_token: token });
  const r = data as Report | null;
  if (!r) notFound();

  const sum = (k: 'views' | 'opened' | 'clicks') => r.totals.reduce((a, t) => a + (t[k] || 0), 0);
  const views = sum('views'), opened = sum('opened'), clicks = sum('clicks');
  const weeks = [...new Set(r.weeks.map(w => w.week))];
  const byWeek = weeks.map(w => ({ week: w, web: r.weeks.find(x => x.week === w && x.channel === 'Website')?.views || 0, paper: r.weeks.find(x => x.week === w && x.channel === 'E-paper')?.views || 0, clicks: r.weeks.filter(x => x.week === w).reduce((a, x) => a + x.clicks, 0) }));
  const peak = Math.max(1, ...byWeek.map(w => w.web + w.paper));
  const mobile = r.devices.find(d => d.device === 'mobile')?.views || 0;
  const running = [day(r.starts_at), day(r.ends_at)].filter(Boolean).join(' to ');

  return <main className={`shell ${styles.wrap}`}>
    <header className={styles.head}>
      <div>
        <span className={styles.kicker}>Webfit News · Your advertising report</span>
        <h1>{r.advertiser}</h1>
        <p className={styles.sub}>{r.campaign}{running ? ` · ${running}` : ''} · <b className={r.status === 'active' ? styles.live : styles.done}>{r.status === 'active' ? 'Running' : r.status}</b></p>
      </div>
      {r.image ? <img className={styles.art} src={resizedImage(r.image, 300, 75)} alt="Your advertisement"/> : null}
    </header>

    <section className={styles.big} aria-label="Totals">
      <div><strong>{n(views)}</strong><span>times your ad was seen</span></div>
      <div><strong>{n(clicks)}</strong><span>clicks to your website or page</span></div>
      <div><strong>{pct(clicks, views)}</strong><span>click rate</span></div>
      <div><strong>{n(opened)}</strong><span>times opened full size</span></div>
    </section>

    <section className={styles.card}>
      <h2>Where it ran</h2>
      <table className={styles.table}>
        <thead><tr><th>Channel</th><th>Seen</th><th>Opened full size</th><th>Clicks</th><th>Click rate</th></tr></thead>
        <tbody>{r.totals.map(t => <tr key={t.channel}><td>{t.channel === 'E-paper' ? 'Weekly e-paper' : 'webfitnews.com'}</td><td>{n(t.views)}</td><td>{n(t.opened)}</td><td>{n(t.clicks)}</td><td>{pct(t.clicks, t.views)}</td></tr>)}</tbody>
      </table>
      {r.placements.length ? <>
        <h3>By position</h3>
        <table className={styles.table}>
          <thead><tr><th>Position</th><th>Seen</th><th>Clicks</th></tr></thead>
          <tbody>{r.placements.map(p => <tr key={p.label + p.channel}><td>{p.label}</td><td>{n(p.views)}</td><td>{n(p.clicks)}</td></tr>)}</tbody>
        </table>
      </> : null}
    </section>

    {byWeek.length ? <section className={styles.card}>
      <h2>Week by week</h2>
      <div className={styles.bars} role="img" aria-label="Times seen each week">
        {byWeek.map(w => <div key={w.week} className={styles.bar}>
          <span className={styles.barNum}>{n(w.web + w.paper)}</span>
          <div className={styles.barStack} style={{ height: `${Math.round(((w.web + w.paper) / peak) * 100)}%` }}>
            {w.paper ? <i className={styles.paper} style={{ flex: w.paper }}/> : null}
            {w.web ? <i className={styles.web} style={{ flex: w.web }}/> : null}
          </div>
          <span className={styles.barLabel}>w/c {weekLabel(w.week)}</span>
          <span className={styles.barClicks}>{n(w.clicks)} clicks</span>
        </div>)}
      </div>
      <p className={styles.legend}><i className={styles.web}/> webfitnews.com <i className={styles.paper}/> e-paper</p>
    </section> : null}

    <section className={styles.card}>
      <h2>Who saw it</h2>
      <p>{views ? `${pct(mobile, views)} on phones, ${pct(views - mobile, views)} on computers and tablets.` : 'Figures appear here as soon as your ad starts running.'}</p>
      <p className={styles.small}>“Seen” counts each time your ad was on a reader’s screen (website: in view on the page; e-paper: on the page being read). Clicks are counted when a reader taps through to your link. Search engines and bots are excluded. Figures update as they happen.</p>
    </section>

    <footer className={styles.foot}>
      <p>Questions or want to book again? Talk to Sandy: <a href="tel:+64221299323">022 129 9323</a> · <a href="mailto:Sandy@WebfitNews.co.nz">Sandy@WebfitNews.co.nz</a></p>
      <p className={styles.small}>This link is private to your business. Please don’t share it publicly.</p>
    </footer>
  </main>;
}
