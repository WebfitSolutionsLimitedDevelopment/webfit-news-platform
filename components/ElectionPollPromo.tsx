'use client';
import { useEffect, useState } from 'react';
import styles from './ElectionPollPromo.module.css';

/**
 * Webfit News reader poll promotion for the 2026 general election.
 * Our own content, not a paid ad, so it carries no "Advertisement" label.
 *
 * It switches itself off at the end of 6 November 2026 NZ time: nothing that
 * could influence voters may be published on election day (7 November).
 * The check runs on the server and again in the browser, so cached or
 * static pages also drop it on time.
 */
const POLL_ENDS = Date.parse('2026-11-06T23:59:59+13:00');
const VOTE_URL = 'https://poll.webfitnews.co.nz/electorates-2026';
const DASHBOARD_URL = 'https://poll.webfitnews.co.nz/coalition-2026';

const tag = (url: string, placement: string) =>
  `${url}?utm_source=webfitnews&utm_medium=house_promo&utm_campaign=election_2026&utm_content=${placement}`;

function useStillOpen() {
  const [open, setOpen] = useState(() => Date.now() < POLL_ENDS);
  useEffect(() => {
    if (Date.now() >= POLL_ENDS) { setOpen(false); return; }
    const timer = setTimeout(() => setOpen(false), Math.min(POLL_ENDS - Date.now(), 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, []);
  return open;
}

/** Slim bar under the site navigation, on every public page. */
export function ElectionPollStrip() {
  const open = useStillOpen();
  if (!open) return null;
  return <div className={styles.strip} role="region" aria-label="Election 2026 reader poll">
    <div className={`shell ${styles.stripInner}`}>
      <span className={styles.stripLabel}>Election 2026</span>
      <span className={styles.stripText}>Have your say in the Webfit News reader poll</span>
      <span className={styles.stripLinks}>
        <a href={tag(VOTE_URL, 'strip')} target="_blank" rel="noopener">Vote in your electorate</a>
        <a href={tag(DASHBOARD_URL, 'strip')} target="_blank" rel="noopener">Live dashboard</a>
      </span>
    </div>
  </div>;
}

/** Card at the end of every story. */
export function ElectionPollCard() {
  const open = useStillOpen();
  if (!open) return null;
  return <aside className={styles.card} aria-label="Election 2026 reader poll">
    <span className={styles.kicker}>Election 2026 · Reader poll</span>
    <h2 className={styles.title}>Who gets your vote in your electorate?</h2>
    <p className={styles.body}>Pick your electorate and cast your party vote in the Webfit News reader poll. Then see how readers&apos; votes are stacking up on our live dashboard.</p>
    <div className={styles.actions}>
      <a className={styles.primary} href={tag(VOTE_URL, 'article_card')} target="_blank" rel="noopener">Vote in your electorate</a>
      <a className={styles.secondary} href={tag(DASHBOARD_URL, 'article_card')} target="_blank" rel="noopener">See the live dashboard</a>
    </div>
    <p className={styles.note}>A voluntary poll of Webfit News readers. It is not weighted and is not a scientific survey.</p>
  </aside>;
}
