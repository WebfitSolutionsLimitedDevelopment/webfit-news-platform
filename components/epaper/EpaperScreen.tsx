import Link from 'next/link';
import type { Edition, EditionSummary } from '@/lib/epaper';
import { resizedImage } from '@/lib/image-url';
import { EpaperBook } from './EpaperBook';
import styles from './Epaper.module.css';

/** The whole e-paper screen: the book, the shelf of editions (newest first) and a plain contents list. */
export function EpaperScreen({ edition, shelf }: { edition: Edition; shelf: EditionSummary[] }) {
  return <main className={`shell ${styles.hub}`}>
    <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/epaper">E-paper</Link><span>/</span><span>{edition.coverage}</span></nav>
    <div className={styles.hubHead}>
      <div>
        <span className={styles.hubKicker}>Webfit News e-paper · No. {edition.number}</span>
        <h1 className={styles.hubTitle}>{edition.title}</h1>
        <p className={styles.hubSub}>{edition.storyCount} stories from {edition.coverage}, the best of them laid out as a 12-page newspaper. New editions every Monday and Thursday.</p>
      </div>
      {edition.isLive ? <span className={styles.liveBadge}>Live · updating as we publish</span> : null}
    </div>

    <EpaperBook edition={edition} shelf={shelf}/>

    <section className={styles.shelf} aria-labelledby="epaper-shelf">
      <h2 id="epaper-shelf" className={styles.shelfTitle}>Recent editions</h2>
      <div className={styles.shelfGrid}>
        {shelf.map(e => <Link key={e.key} href={e.href} className={`${styles.cover} ${e.key === edition.key ? styles.coverCurrent : ''}`} aria-current={e.key === edition.key ? 'page' : undefined}>
          <div className={styles.coverThumb}>
            {e.isLive ? <span className={styles.coverLive}>{e.storyCount < 10 ? 'Filling up' : 'Live'}</span> : null}
            <img className={styles.coverLogo} src="/webfit-news-logo-400.webp" alt=""/>
            <div className={styles.coverRule}/>
            {e.coverImage ? <img className={styles.coverImg} src={resizedImage(e.coverImage, 320, 70)} alt="" loading="lazy"/> : <div className={styles.coverImg}/>}
            <div className={styles.coverHeadline}>{e.headline || 'Stories on their way'}</div>
          </div>
          <div className={styles.coverMeta}><strong>{e.title}</strong>{e.coverage} · No. {e.number} · {e.storyCount} stories</div>
        </Link>)}
      </div>
    </section>

    <div className={styles.advertiseStrip}>
      <div><strong>Put your business in the e-paper</strong><p>Full pages and half pages in every edition, twice a week.</p></div>
      <Link href="/advertise-media-kit">See the media kit</Link>
    </div>

    {edition.sections.length ? <section className={styles.contentsList} aria-labelledby="epaper-contents">
      <h2 id="epaper-contents">In this edition</h2>
      {edition.sections.map(section => <section key={section.title}>
        <h3>{section.title}</h3>
        <ul>{section.stories.map(s => <li key={s.id}><Link href={`/${s.slug}`}>{s.title}</Link></li>)}</ul>
      </section>)}
      {edition.moreStories.length ? <section>
        <h3>Also this edition</h3>
        <ul>{edition.moreStories.map(s => <li key={s.slug}><Link href={`/${s.slug}`}>{s.title}</Link></li>)}</ul>
      </section> : null}
    </section> : null}
  </main>;
}
