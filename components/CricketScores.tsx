import Link from 'next/link';
import styles from './CricketScores.module.css';

// Use the provider's published iframe directly. No API key or third-party
// script is needed in the parent page, and scores stay inside this frame.
const widgetUrl = 'https://cwidget.crictimes.org/?v=1.1&a=ffffff&c=18212b&bo=e2e5e8&b=f3f5f7&sb=ffffff&lb=c8102e&lc=ffffff&db=18212b&dc=ffffff&tc=18212b&ti=c8102e';

export function CricketScores({ compact = false }: { compact?: boolean }) {
  const scores = <>
    <iframe
      className={styles.frame}
      src={widgetUrl}
      title="Cricket scores, results and upcoming matches from CricTimes"
      loading="lazy"
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    />
    <p className={styles.note}>
      Scores supplied by <a href="https://crictimes.org/cricket-scores" target="_blank" rel="noopener noreferrer nofollow">CricTimes</a>.
      {' '}Updates may be delayed. If scores do not load, open the provider link.
    </p>
  </>;

  return <section className={styles.panel} aria-label="Live cricket scores">
    {compact ? <details>
      <summary className={styles.summary}>
        <span>Cricket scores</span><span className={styles.action}>View scores</span>
      </summary>
      <div className={styles.body}>
        <p className={styles.intro}>Follow the latest scores, results and upcoming matches.</p>
        {scores}
        <Link className={styles.more} href="/live-cricket">Open cricket score centre →</Link>
      </div>
    </details> : <div className={styles.body}>{scores}</div>}
  </section>;
}
