import Link from 'next/link';
import { featuredEdition, getEditionShelf } from '@/lib/epaper';
import { resizedImage } from '@/lib/image-url';
import styles from './EpaperPromo.module.css';

/**
 * Homepage band for the e-paper: the edition /epaper opens, as a little front
 * page, plus the editions before it. Deliberately ad-free (no AdSlot inside or
 * touching it on the homepage).
 */
export async function EpaperPromo() {
  let shelf: Awaited<ReturnType<typeof getEditionShelf>> = [];
  try { shelf = await getEditionShelf(); } catch { return null; }
  const main = featuredEdition(shelf);
  if (!main || !main.storyCount) return null;
  const others = shelf.filter(e => e.key !== main.key && e.storyCount > 0).slice(0, 3);

  return <section className={styles.band} aria-labelledby="home-epaper">
    <div className={styles.inner}>
      <Link href="/epaper" className={styles.cover} aria-label={`Read the e-paper: ${main.title}, ${main.coverage}`}>
        <span className={styles.paper}>
          <span className={styles.paperTop}><span>{main.dateline}</span><span>No. {main.number}</span></span>
          <img className={styles.paperLogo} src="/webfit-news-logo-400.webp" alt=""/>
          <span className={styles.paperRule}/>
          <span className={styles.paperHeadline}>{main.headline}</span>
          {main.coverImage ? <img className={styles.paperImg} src={resizedImage(main.coverImage, 520, 72)} alt="" loading="lazy"/> : null}
          <span className={styles.paperLines} aria-hidden="true"><i/><i/><i/><i/><i/><i/></span>
        </span>
      </Link>

      <div className={styles.copy}>
        <span className={styles.kicker}>Webfit News e-paper</span>
        <h2 id="home-epaper" className={styles.title}>Read this week’s paper, page by page</h2>
        <p className={styles.lead}>{main.title} · {main.coverage} · {main.storyCount} stories, laid out as a newspaper you can flip through on your phone or laptop. New editions every Monday and Thursday.</p>
        <div className={styles.actions}>
          <Link href="/epaper" className={styles.primary}>Read the e-paper →</Link>
          {main.isLive ? <span className={styles.live}>Updating as we publish</span> : null}
        </div>
        {others.length ? <div className={styles.shelf}>
          <span>Earlier editions</span>
          <ul>{others.map(e => <li key={e.key}><Link href={e.href}>
            {e.coverImage ? <img src={resizedImage(e.coverImage, 160, 65)} alt="" loading="lazy"/> : <b/>}
            <span><strong>{e.title}</strong>{e.coverage} · {e.storyCount} stories</span>
          </Link></li>)}</ul>
        </div> : null}
      </div>
    </div>
  </section>;
}
