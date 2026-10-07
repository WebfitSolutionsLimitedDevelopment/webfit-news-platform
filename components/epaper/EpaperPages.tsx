import Link from 'next/link';
import type { Edition, EpaperAd, EpaperPage, EpaperStory } from '@/lib/epaper';
import { resizedImage } from '@/lib/image-url';
import styles from './Epaper.module.css';

const timeLabel = (iso: string) => new Intl.DateTimeFormat('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Pacific/Auckland' }).format(new Date(iso));

function Photo({ story, width, className }: { story: EpaperStory; width: number; className?: string }) {
  if (!story.image) return null;
  return <img className={className} src={resizedImage(story.image, width, 72)} alt={story.imageAlt} loading="lazy" decoding="async"/>;
}

function Story({ story, variant }: { story: EpaperStory; variant: 'lead' | 'feature' | 'brief' | 'compact' }) {
  return <article className={`${styles.story} ${styles[`story_${variant}`]}`}>
    {variant !== 'brief' ? <Link href={`/${story.slug}`} className={styles.photoLink} tabIndex={-1}><Photo story={story} width={variant === 'lead' ? 900 : variant === 'compact' ? 240 : 480} className={styles.photo}/></Link> : null}
    <div className={styles.storyCopy}>
      {story.categoryName ? <span className={styles.storyKicker}>{story.categoryName}</span> : null}
      <h3 className={styles.storyTitle}><Link href={`/${story.slug}`}>{story.title}</Link></h3>
      {story.excerpt ? <p className={styles.storyExcerpt}>{story.excerpt}</p> : null}
      <span className={styles.storyMeta}>{timeLabel(story.published_at)} · <Link href={`/${story.slug}`}>Read full story →</Link></span>
    </div>
  </article>;
}

function Folio({ edition, page, label }: { edition: Edition; page: number; label: string }) {
  return <div className={styles.folio}>
    <span>{page}</span>
    <span>Webfit News e-paper · {label}</span>
    <span>{edition.coverage}</span>
  </div>;
}

function AdArtwork({ ad, size }: { ad: EpaperAd; size: 'full' | 'half' }) {
  return <div className={size === 'full' ? styles.fullAd : styles.halfAd} data-ad-assignment={ad.assignmentId}>
    <span className={styles.adLabel}>Advertisement{ad.advertiser ? ` · ${ad.advertiser}` : ''}</span>
    <a href={ad.href} target="_blank" rel="sponsored noopener" className={styles.adLink}>
      <img src={resizedImage(ad.image, size === 'full' ? 1240 : 1000, 80)} alt={ad.alt} loading="lazy" decoding="async"/>
    </a>
    {ad.isElectionAd && ad.promoterStatement ? <span className={styles.promoter}>{ad.promoterStatement}</span> : null}
  </div>;
}

function HouseAd({ size }: { size: 'full' | 'half' }) {
  return <div className={size === 'full' ? styles.houseFull : styles.houseHalf}>
    <span className={styles.houseKicker}>Advertise in the e-paper</span>
    <strong className={styles.houseTitle}>{size === 'full' ? 'Your business could own this page' : 'Put your business in front of our readers'}</strong>
    <p className={styles.houseText}>{size === 'full'
      ? 'A full page in the Webfit News e-paper, read three times a week by Kiwi-Indian and wider New Zealand communities. Full and half pages, section sponsorship and community notices available.'
      : 'Half pages next to the stories our readers care about, in every edition.'}</p>
    <Link href="/advertise-media-kit" className={styles.houseButton}>Book a page</Link>
  </div>;
}

function FrontPage({ edition, page }: { edition: Edition; page: Extract<EpaperPage, { kind: 'front' }> }) {
  return <div className={`${styles.page} ${styles.front}`}>
    <header className={styles.masthead}>
      <div className={styles.mastheadTop}>
        <span>Vol. 1 · No. {edition.number}</span>
        <span>{edition.isLive ? 'Live edition · updating as stories publish' : 'Independent New Zealand journalism'}</span>
        <span>Free to read</span>
      </div>
      <img className={styles.logo} src="/webfit-news-logo-400.webp" alt="Webfit News"/>
      <div className={styles.mastheadDate}>{edition.title.replace(' edition', '')} · {edition.coverage}</div>
    </header>
    {page.lead ? <>
      <div className={styles.frontGrid}>
        <Story story={page.lead} variant="lead"/>
        <aside className={styles.contents}>
          <strong>Inside this edition</strong>
          <ol>{page.contents.map(c => <li key={c.title}><span>{c.title}</span><span>{c.page}</span></li>)}</ol>
        </aside>
      </div>
      <div className={styles.frontRow}>{page.stories.map(s => <Story key={s.id} story={s} variant="compact"/>)}</div>
    </> : <div className={styles.emptyEdition}>
      <strong>This edition fills up as we publish.</strong>
      <p>Stories from {edition.coverage} will appear here within minutes of going live on webfitnews.com.</p>
    </div>}
    <Folio edition={edition} page={1} label="Front page"/>
  </div>;
}

function SectionPage({ edition, page, number }: { edition: Edition; page: Extract<EpaperPage, { kind: 'section' }>; number: number }) {
  const [lead, ...others] = page.stories;
  const hasHalf = Boolean(page.halfAd || page.houseHalf);
  return <div className={`${styles.page} ${styles.sectionPage}`}>
    <header className={styles.sectionHead}>
      <span className={styles.sectionKicker}>{page.section.kicker}</span>
      <h2 className={styles.sectionTitle}>{page.section.title}{page.continued ? <small> continued</small> : null}</h2>
    </header>
    <div className={`${styles.sectionBody} ${page.halfAd || page.houseHalf ? styles.withHalf : ''}`}>
      {lead ? <Story story={lead} variant="lead"/> : null}
      {others.length ? <div className={styles.sectionGrid}>{others.map((s, i) => <Story key={s.id} story={s} variant={i < 2 && !hasHalf && others.length > 1 ? 'feature' : 'brief'}/>)}</div> : null}
    </div>
    {page.halfAd ? <AdArtwork ad={page.halfAd} size="half"/> : page.houseHalf ? <HouseAd size="half"/> : null}
    <Folio edition={edition} page={number} label={page.section.title}/>
  </div>;
}

function AdPage({ edition, page, number }: { edition: Edition; page: Extract<EpaperPage, { kind: 'ad' }>; number: number }) {
  return <div className={`${styles.page} ${styles.adPage}`}>
    {page.ad ? <AdArtwork ad={page.ad} size="full"/> : <HouseAd size="full"/>}
    <Folio edition={edition} page={number} label="Advertisement"/>
  </div>;
}

function BackPage({ edition, page, number }: { edition: Edition; page: Extract<EpaperPage, { kind: 'back' }>; number: number }) {
  return <div className={`${styles.page} ${styles.backPage}`}>
    <img className={styles.backLogo} src="/webfit-news-logo-400.webp" alt="Webfit News"/>
    <h2 className={styles.backTitle}>Every story, every day, on webfitnews.com</h2>
    <p className={styles.backText}>The e-paper is built from our live newsroom. New editions arrive every Monday, Wednesday and Friday, and the current one keeps updating as we publish.</p>
    {page.latest.length ? <div className={styles.backEditions}>
      <strong>Other recent editions</strong>
      <ul>{page.latest.map(e => <li key={e.key}><Link href={`/epaper/${e.key}`}>{e.title}</Link><span>{e.coverage}</span></li>)}</ul>
    </div> : null}
    <div className={styles.backActions}>
      <Link href="/support-us" className={styles.houseButton}>Support independent journalism</Link>
      <Link href="/advertise-media-kit" className={styles.backSecondary}>Advertise in the e-paper</Link>
    </div>
    <Folio edition={edition} page={number} label="Back page"/>
  </div>;
}

/** One rendered e-paper page. Plain server markup: the viewer only moves it around. */
export function EpaperPageView({ edition, page, index }: { edition: Edition; page: EpaperPage; index: number }) {
  const number = index + 1;
  switch (page.kind) {
    case 'front': return <FrontPage edition={edition} page={page}/>;
    case 'section': return <SectionPage edition={edition} page={page} number={number}/>;
    case 'ad': return <AdPage edition={edition} page={page} number={number}/>;
    case 'back': return <BackPage edition={edition} page={page} number={number}/>;
  }
}
