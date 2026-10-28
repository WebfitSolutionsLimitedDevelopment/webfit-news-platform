import { ElectionPollCard } from '@/components/ElectionPollPromo';
import { HideAfter } from '@/components/HideAfter';
import { LiveResultsCard } from '@/components/LiveResultsCard';
import styles from './CoalitionTrendCard.module.css';

/**
 * Live "How the race has moved" chart from the Webfit News reader poll,
 * shown at the end of every story until the end of 4 November 2026 NZ time.
 * From 5 November the official live results card takes its place.
 *
 * Data comes from poll.webfitnews.co.nz/api/public/coalition (percentages
 * only, no vote counts), cached for 5 minutes. If the feed is unavailable,
 * the existing reader-poll promo card is shown instead.
 */

const API_URL = process.env.COALITION_API_URL || 'https://poll.webfitnews.co.nz/api/public/coalition';
// Results card from the start of 5 November 2026 NZ time.
const SHOW_UNTIL = Date.parse('2026-11-05T00:00:00+13:00');

type Bloc = 'government' | 'opposition' | 'other';
type TrendPoint = { date: string } & Record<Bloc, number>;
type Feed = {
  shares: Record<Bloc, number>;
  trend: TrendPoint[];
  dashboardUrl: string;
  voteUrl: string;
};

const BLOCS: Bloc[] = ['government', 'opposition', 'other'];
const META: Record<Bloc, { label: string; short: string; parties: string; colour: string }> = {
  government: { label: 'Government', short: 'Gov', parties: 'National · ACT · NZ First', colour: '#2a63b0' },
  opposition: { label: 'Opposition', short: 'Opp', parties: 'Labour · Green · Te Pāti Māori', colour: '#c0303a' },
  other: { label: 'Others', short: 'Others', parties: 'Other parties', colour: '#d08a1c' },
};

const tag = (url: string) =>
  `${url}?utm_source=webfitnews&utm_medium=house_promo&utm_campaign=election_2026&utm_content=article_trend`;

const pct = (v: number) => `${v.toFixed(1)}%`;

async function loadFeed(): Promise<Feed | null> {
  try {
    const res = await fetch(API_URL, { next: { revalidate: 300 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = (await res.json()) as Feed;
    return Array.isArray(data?.trend) && data.trend.length >= 2 && data.shares ? data : null;
  } catch {
    return null;
  }
}

function TrendChart({ trend, compact }: { trend: TrendPoint[]; compact: boolean }) {
  const W = compact ? 360 : 680;
  const H = compact ? 250 : 270;
  const pad = compact ? { top: 14, right: 104, bottom: 30, left: 40 } : { top: 16, right: 150, bottom: 34, left: 40 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const x = (i: number) => pad.left + (i / (trend.length - 1)) * innerW;
  const y = (v: number) => pad.top + innerH - (v / 100) * innerH;
  const day = new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const label = (d: string) => day.format(new Date(`${d}T00:00:00Z`));
  const step = Math.max(1, Math.ceil(trend.length / (compact ? 3 : 5)));
  const last = trend[trend.length - 1];

  // Keep end labels at least 16px apart.
  const ends = BLOCS.map((b) => ({ b, v: last[b], y: y(last[b]) })).sort((a, c) => a.y - c.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} role="img" aria-label="Running share of reader votes by bloc over time">
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={pad.left} x2={pad.left + innerW} y1={y(v)} y2={y(v)} stroke={v === 50 ? '#525252' : '#eceae4'} strokeWidth={v === 50 ? 1.25 : 1} strokeDasharray={v === 50 ? '4 4' : undefined} />
          <text x={pad.left - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill={v === 50 ? '#262626' : '#737373'} fontWeight={v === 50 ? 700 : 400}>{v}%</text>
        </g>
      ))}
      {BLOCS.map((b) => (
        <polyline key={b} fill="none" stroke={META[b].colour} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={trend.map((p, i) => `${x(i)},${y(p[b])}`).join(' ')} />
      ))}
      {BLOCS.map((b) => (
        <circle key={b} cx={x(trend.length - 1)} cy={y(last[b])} r={4.5} fill={META[b].colour} stroke="#fff" strokeWidth={2} />
      ))}
      {ends.map((e) => (
        <g key={e.b}>
          <rect x={x(trend.length - 1) + 12} y={e.y - 5} width={10} height={10} rx={2} fill={META[e.b].colour} />
          <text x={x(trend.length - 1) + 27} y={e.y + 4} fontSize="12" fill="#262626">
            <tspan fontWeight="700">{pct(e.v)}</tspan> {compact ? META[e.b].short : META[e.b].label}
          </text>
        </g>
      ))}
      {trend.map((p, i) =>
        i % step === 0 || i === trend.length - 1 ? (
          <text key={p.date} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#737373">{label(p.date)}</text>
        ) : null,
      )}
      {trend.map((p, i) => {
        const half = innerW / (trend.length - 1) / 2;
        return (
          <rect key={`hit-${p.date}`} x={x(i) - half} y={pad.top} width={half * 2} height={innerH} fill="transparent">
            <title>{`${label(p.date)} — Government ${pct(p.government)} · Opposition ${pct(p.opposition)} · Others ${pct(p.other)}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

export async function CoalitionTrendCard() {
  if (Date.now() >= SHOW_UNTIL) return <LiveResultsCard />;
  const feed = await loadFeed();
  if (!feed) return <ElectionPollCard />;

  const leader =
    feed.shares.government > feed.shares.opposition
      ? 'Government bloc ahead'
      : feed.shares.opposition > feed.shares.government
        ? 'Opposition bloc ahead'
        : 'Blocs level';

  return (
    <HideAfter until={SHOW_UNTIL} fallback={<LiveResultsCard />}>
      <aside className={styles.card} aria-label="Election 2026 reader poll: how the blocs are tracking">
        <span className={styles.kicker}>Election 2026 · Reader poll</span>
        <h2 className={styles.title}>How the race has moved: {leader}</h2>

        <ul className={styles.shares}>
          {BLOCS.map((b) => (
            <li key={b}>
              <span className={styles.swatch} style={{ background: META[b].colour }} />
              <span className={styles.shareLabel}>{META[b].label}</span>
              <strong>{pct(feed.shares[b])}</strong>
              <small>{META[b].parties}</small>
            </li>
          ))}
        </ul>

        <div className={styles.chartWrap}>
          <div className={styles.compactOnly}><TrendChart trend={feed.trend} compact /></div>
          <div className={styles.wideOnly}><TrendChart trend={feed.trend} compact={false} /></div>
          <p className={styles.axisNote}>Running share of reader votes at the end of each day · dashed line = 50%</p>
        </div>

        <div className={styles.actions}>
          <a className={styles.primary} href={tag(feed.voteUrl)} target="_blank" rel="noopener">Vote in your electorate</a>
          <a className={styles.secondary} href={tag(feed.dashboardUrl)} target="_blank" rel="noopener">See the full dashboard</a>
        </div>
        <p className={styles.note}>A voluntary poll of Webfit News readers. It is not weighted, is not a scientific survey and is not a seat projection.</p>
      </aside>
    </HideAfter>
  );
}
