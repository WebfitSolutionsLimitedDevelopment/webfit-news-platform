import Link from 'next/link';
import { EPAPER_SECTIONS, type Edition, type EditionSummary } from '@/lib/epaper';
import { resizedImage } from '@/lib/image-url';
import { EpaperPageView } from './EpaperPages';
import { EpaperViewer } from './EpaperViewer';
import styles from './Epaper.module.css';

/** The whole e-paper screen: viewer, shelf of editions (newest first) and a plain contents list. */
export function EpaperScreen({ edition, shelf }: { edition: Edition; shelf: EditionSummary[] }) {
  const pages = edition.pages.map((page, index) => ({
    key: `${edition.key}-${index}`,
    label: page.label,
    node: <EpaperPageView edition={edition} page={page} index={index}/>,
  }));

  const bySection = EPAPER_SECTIONS
    .map(section => ({ section, stories: edition.stories.filter(s => s.section === section.key) }))
    .filter(group => group.stories.length);

  return <main className={`shell ${styles.hub}`}>
    <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/epaper">E-paper</Link><span>/</span><span>{edition.coverage}</span></nav>
    <div className={styles.hubHead}>
      <div>
        <span className={styles.hubKicker}>Webfit News e-paper · No. {edition.number}</span>
        <h1 className={styles.hubTitle}>{edition.title}</h1>
        <p className={styles.hubSub}>{edition.stories.length} stories from {edition.coverage}, laid out as a newspaper. New editions every Monday, Wednesday and Friday.</p>
      </div>
      {edition.isLive ? <span className={styles.liveBadge}>Live edition · updates as we publish</span> : null}
    </div>

    <EpaperViewer pages={pages} title={edition.title}/>

    <section className={styles.shelf} aria-labelledby="epaper-shelf">
      <h2 id="epaper-shelf" className={styles.shelfTitle}>Editions from the last 15 days</h2>
      <div className={styles.shelfGrid}>
        {shelf.map(e => <Link key={e.key} href={`/epaper/${e.key}`} className={`${styles.cover} ${e.key === edition.key ? styles.coverCurrent : ''}`} aria-current={e.key === edition.key ? 'page' : undefined}>
          <div className={styles.coverThumb}>
            {e.isLive ? <span className={styles.coverLive}>Live</span> : null}
            <img className={styles.coverLogo} src="/webfit-news-logo-400.webp" alt=""/>
            <div className={styles.coverRule}/>
            {e.coverImage ? <img className={styles.coverImg} src={resizedImage(e.coverImage, 320, 70)} alt="" loading="lazy"/> : <div className={styles.coverImg}/>}
            <div className={styles.coverHeadline}>{e.headline || 'Stories on their way'}</div>
          </div>
          <div className={styles.coverMeta}><strong>{e.coverage}</strong>No. {e.number} · {e.storyCount} {e.storyCount === 1 ? 'story' : 'stories'}</div>
        </Link>)}
      </div>
    </section>

    <div className={styles.advertiseStrip}>
      <div><strong>Put your business in the e-paper</strong><p>Full pages, half pages and section sponsorship in every edition.</p></div>
      <Link href="/advertise-media-kit">See the media kit</Link>
    </div>

    {bySection.length ? <section className={styles.contentsList} aria-labelledby="epaper-contents">
      <h2 id="epaper-contents">In this edition</h2>
      {bySection.map(({ section, stories }) => <section key={section.key}>
        <h3>{section.title}</h3>
        <ul>{stories.map(s => <li key={s.id}><Link href={`/${s.slug}`}>{s.title}</Link></li>)}</ul>
      </section>)}
    </section> : null}
  </main>;
}
