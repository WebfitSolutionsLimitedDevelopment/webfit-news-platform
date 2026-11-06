'use client';

import { useEffect, useState } from 'react';
import styles from './LiveResultsCard.module.css';

const RESULTS_URL = 'https://poll.webfitnews.co.nz/results-2026';
const API_URL = 'https://poll.webfitnews.co.nz/api/public/results';
const REFRESH_MS = 60_000;
const votes = new Intl.NumberFormat('en-NZ');

type Feed = {
  hasResults: boolean;
  pollsClosed?: boolean;
  percentPlacesCounted: number;
  advanceVoting?: { date: string; total: number } | null;
  parties: { abbrev: string; name: string; percent: number }[];
};

export function LiveResultsCard() {
  const [feed, setFeed] = useState<Feed | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function refresh() {
      try {
        const response = await fetch(API_URL, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(16_000)]),
        });
        if (!response.ok && response.status !== 503) return;
        const data: Feed = await response.json();
        if (controller.signal.aborted || !Array.isArray(data.parties)) return;
        setFeed(previous => previous?.hasResults && !data.hasResults ? previous : data);
      } catch {
        // Keep the last usable update and retry on the next interval.
      }
    }

    void refresh();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, REFRESH_MS);
    return () => {
      window.clearInterval(timer);
      controller.abort();
    };
  }, []);

  const live = feed?.hasResults;
  const advance = feed?.advanceVoting;
  const leaders = live ? [...feed.parties].sort((a, b) => b.percent - a.percent).slice(0, 2) : [];

  return (
    <aside aria-label="2026 election updates">
      <a className={styles.strip} href={RESULTS_URL}>
        <span className={styles.details}>
          <strong>{live ? 'NZ Election 2026 · Preliminary results' : 'NZ Election 2026'}</strong>
          {live ? (
            <span>
              {feed.percentPlacesCounted.toFixed(1)}% of voting places counted
              {leaders.map(party => (
                <span key={party.abbrev}> · {party.name} {party.percent.toFixed(1)}%</span>
              ))}
            </span>
          ) : (
            <span>
              {advance ? `${votes.format(advance.total)} advance votes through ${advance.date} · ` : ''}
              {feed?.pollsClosed ? 'Awaiting the first results' : 'Results from 7 pm, Saturday 7 November'}
            </span>
          )}
        </span>
        <span className={styles.link}>Full results <span aria-hidden="true">→</span></span>
      </a>
    </aside>
  );
}
