import base from './CoalitionTrendCard.module.css';
import styles from './LiveResultsCard.module.css';

/**
 * Official 2026 election results card, shown at the end of every story from
 * 5 November 2026. Until the Electoral Commission releases counts (from 7pm
 * on 7 November) it only says when results will appear.
 *
 * Data: poll.webfitnews.co.nz/api/public/results (Electoral Commission feed,
 * cached for a minute).
 */

const API_URL = process.env.RESULTS_API_URL || 'https://poll.webfitnews.co.nz/api/public/results';
const RESULTS_URL = 'https://poll.webfitnews.co.nz/results-2026';

type Bloc = 'government' | 'opposition' | 'other';
type Feed = {
  hasResults: boolean;
  percentPlacesCounted: number;
  totalSeats: number;
  majority: number;
  blocs: Record<Bloc, { percent: number; seats: number }>;
  parties: { abbrev: string; name: string; bloc: Bloc; percent: number; seats: number }[];
};

const ORDER: Bloc[] = ['government', 'other', 'opposition'];
const META: Record<Bloc, { label: string; parties: string; colour: string }> = {
  government: { label: 'Government', parties: 'National · ACT · NZ First', colour: '#2a63b0' },
  opposition: { label: 'Opposition', parties: 'Labour · Green · Te Pāti Māori', colour: '#c0303a' },
  other: { label: 'Others', parties: 'Other parties', colour: '#d08a1c' },
};

const tag = (url: string) =>
  `${url}?utm_source=webfitnews&utm_medium=house_promo&utm_campaign=election_2026&utm_content=article_results`;

async function loadFeed(): Promise<Feed | null> {
  try {
    const res = await fetch(API_URL, { next: { revalidate: 60 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = (await res.json()) as Feed;
    return data && data.blocs && Array.isArray(data.parties) ? data : null;
  } catch {
    return null;
  }
}

export async function LiveResultsCard() {
  const feed = await loadFeed();

  if (!feed || !feed.hasResults) {
    return (
      <aside className={base.card} aria-label="Election 2026 results">
        <span className={base.kicker}>Election 2026 · Official results</span>
        <h2 className={base.title}>Results from 7pm on Saturday 7 November</h2>
        <p className={styles.lead}>
          Voting places close at 7pm on election day. Follow the official count live on our results page as the
          Electoral Commission releases it.
        </p>
        <div className={base.actions}>
          <a className={base.primary} href={tag(RESULTS_URL)} target="_blank" rel="noopener">Live results page</a>
        </div>
      </aside>
    );
  }

  const total = Math.max(feed.totalSeats, 1);
  const pct = (v: number) => `${v.toFixed(1)}%`;

  return (
    <aside className={base.card} aria-label="Election 2026 live results">
      <span className={base.kicker}>Election 2026 · Live results</span>
      <h2 className={base.title}>{pct(feed.percentPlacesCounted)} of voting places counted</h2>

      <ul className={base.shares}>
        {ORDER.map((b) => (
          <li key={b}>
            <span className={base.swatch} style={{ background: META[b].colour }} />
            <span className={base.shareLabel}>{META[b].label}</span>
            <strong>{feed.blocs[b].seats} seats</strong>
            <small>{pct(feed.blocs[b].percent)} party vote · {META[b].parties}</small>
          </li>
        ))}
      </ul>

      <div className={styles.barWrap}>
        <div className={styles.bar}>
          {ORDER.map((b) =>
            feed.blocs[b].seats > 0 ? (
              <span key={b} style={{ width: `${(feed.blocs[b].seats / total) * 100}%`, background: META[b].colour }} />
            ) : null,
          )}
        </div>
        <span className={styles.majority} style={{ left: `${(feed.majority / total) * 100}%` }} aria-hidden />
        <p className={base.axisNote}>Line = {feed.majority} seats needed to govern ({feed.totalSeats} seats)</p>
      </div>

      <ol className={styles.parties}>
        {feed.parties.slice(0, 6).map((p) => (
          <li key={p.abbrev}>
            <span className={base.swatch} style={{ background: META[p.bloc].colour }} />
            <span className={styles.partyName}>{p.name}</span>
            <span className={styles.partyPct}>{pct(p.percent)}</span>
            <strong>{p.seats}</strong>
          </li>
        ))}
      </ol>

      <div className={base.actions}>
        <a className={base.primary} href={tag(RESULTS_URL)} target="_blank" rel="noopener">Full live results</a>
      </div>
      <p className={base.note}>
        Preliminary election-night results from the Electoral Commission. Special votes are counted later, and the
        official result is due on 27 November.
      </p>
    </aside>
  );
}
