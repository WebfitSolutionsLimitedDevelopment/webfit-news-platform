import Link from 'next/link';
import styles from './ArticleEnd.module.css';
import { getPublicStoryTitle } from '@/lib/public-story-display';

type S = { slug: string; title: string; media?: { public_url?: string | null; alt_text?: string | null } | null } | null;

/** Previous (older) and next (newer) story links at the end of every article. */
export function ArticlePrevNext({ previous, next }: { previous: S; next: S }) {
  if (!previous && !next) return null;
  const card = (s: NonNullable<S>, dir: 'prev' | 'next') => (
    <Link className={`${styles.pn} ${dir === 'next' ? styles.pnNext : ''}`} href={`/${s.slug}`} rel={dir}>
      <span className={styles.pnLabel}>{dir === 'prev' ? '← Previous story' : 'Next story →'}</span>
      <strong>{getPublicStoryTitle(s.title)}</strong>
    </Link>
  );
  return (
    <nav className={styles.prevNext} aria-label="More stories">
      {previous ? card(previous, 'prev') : <span />}
      {next ? card(next, 'next') : <span />}
    </nav>
  );
}
