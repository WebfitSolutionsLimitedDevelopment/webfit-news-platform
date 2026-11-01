import Link from 'next/link';
import styles from './CricketScores.module.css';

// Use the provider's published iframe directly. No API key or third-party
// script is needed in the parent page, and scores stay inside this frame.
const widgetUrl = 'https://cwidget.crictimes.org/?v=1.1&a=ffffff&c=18212b&bo=e2e5e8&b=f3f5f7&sb=ffffff&lb=c8102e&lc=ffffff&db=18212b&dc=ffffff&tc=18212b&ti=c8102e';

export function CricketScores({ compact = false }: { compact?: boolean }) {
  const scores = <>
    <iframe
      className={compact ? `${styles.frame} ${styles.compactFrame}` : styles.frame}
      src={compact ? widgetUrl.replace('lb=c8102e&lc=ffffff', 'lb=ffffff&lc=ffffff') : widgetUrl}
      tabIndex={compact ? -1 : undefined}
      title="Cricket scores, results and upcoming matches from CricTimes"
      loading={compact ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    />
  </>;

  return <section className={compact ? `${styles.panel} ${styles.strip}` : styles.panel} aria-label="Live cricket scores">
    {compact ? <>
      <div className={styles.stripHeading}>
        <span>Cricket scores</span><Link href="/live-cricket">Full score centre →</Link>
      </div>
      <div className={styles.scoreDisplay}>
        {scores}
        <Link className={styles.scoreLink} href="/live-cricket" aria-label="Open the full cricket score centre on Webfit News" />
      </div>
    </> : <div className={styles.body}>{scores}</div>}
  </section>;
}
