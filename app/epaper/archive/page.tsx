import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { listAllEditions } from '@/lib/epaper';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import styles from '@/components/epaper/Epaper.module.css';

/** Pure date arithmetic, no database: cheap however many editions there are. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: `E-paper archive | ${SITE_NAME}` },
  description: 'Every Webfit News e-paper edition since launch, Midweek and Weekend, newest first.',
  alternates: { canonical: absoluteUrl('/epaper/archive') },
};

const monthLabel = (ymd: string) => new Intl.DateTimeFormat('en-NZ', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`));

export default function EpaperArchivePage() {
  const editions = listAllEditions();
  const months: Array<{ label: string; items: typeof editions }> = [];
  for (const e of editions) {
    const label = monthLabel(e.firstDay);
    if (months[months.length - 1]?.label !== label) months.push({ label, items: [] });
    months[months.length - 1].items.push(e);
  }
  return <>
    <SiteHeader quiet/>
    <main className={`shell ${styles.hub}`}>
      <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/epaper">E-paper</Link><span>/</span><span>Archive</span></nav>
      <div className={styles.hubHead}>
        <div>
          <span className={styles.hubKicker}>Webfit News e-paper</span>
          <h1 className={styles.hubTitle}>Every edition</h1>
          <p className={styles.hubSub}>{editions.length} editions since {monthLabel(editions[editions.length - 1]?.firstDay || '2026-09-21')}. A new one every Monday and Thursday.</p>
        </div>
      </div>
      {months.map(m => <section key={m.label} className={styles.archiveMonth} aria-label={m.label}>
        <h2>{m.label}</h2>
        <ul>{m.items.map(e => <li key={e.key}>
          <Link href={e.isLive ? '/epaper' : e.href}>
            <span className={styles.archiveNo}>No. {e.number}</span>
            <strong>{e.title}</strong>
            <span>{e.coverage}</span>
            {e.isLive ? <em>Current</em> : null}
          </Link>
        </li>)}</ul>
      </section>)}
    </main>
    <PublicFooter/>
  </>;
}
