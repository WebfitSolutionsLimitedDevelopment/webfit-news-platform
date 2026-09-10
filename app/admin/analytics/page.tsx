import Link from 'next/link';
import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import { requireAdmin } from '../../../lib/admin-auth';
import {
  ANALYTICS_PERIODS,
  getStoryAnalytics,
  type AnalyticsPeriodKey,
} from '../../../lib/story-analytics';
import './analytics.css';

type PublishRangeKey = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'custom';

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
};

type SearchParams = Promise<{
  period?: string;
  published?: string;
  date?: string;
  story?: string;
}>;

const PUBLISH_RANGES: Record<PublishRangeKey, string> = {
  all: 'All published stories',
  today: 'Published today',
  yesterday: 'Published yesterday',
  '7d': 'Published in last 7 days',
  '30d': 'Published in last 30 days',
  custom: 'Published on a date',
};

function compact(value: number) {
  return new Intl.NumberFormat('en-NZ', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

function normalizePath(value: string) {
  const path = (value || '/').split('?')[0].split('#')[0];
  const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path;
  if (trimmed.startsWith('/article/')) return `/${trimmed.slice('/article/'.length)}`;
  return trimmed || '/';
}

function aucklandDateKey(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function shiftDateKey(key: string, days: number) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString().slice(0, 10);
}

function gaDateKey(key: string) {
  return key.replaceAll('-', '');
}

function periodDateKeys(period: AnalyticsPeriodKey, today: string) {
  if (period === 'yesterday') return [gaDateKey(shiftDateKey(today, -1))];
  const days = period === 'today' ? 1 : period === '7d' ? 7 : period === '90d' ? 90 : 28;
  return Array.from({ length: days }, (_, index) => gaDateKey(shiftDateKey(today, index - days + 1)));
}

function formatGaDate(value: string) {
  if (!/^\d{8}$/.test(value)) return value;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  return new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short' }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function formatPublished(value: string | null) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function inPublishRange(article: ArticleRow, range: PublishRangeKey, customDate: string, today: string) {
  if (range === 'all') return true;
  if (!article.published_at) return false;
  const published = aucklandDateKey(article.published_at);
  if (range === 'today') return published === today;
  if (range === 'yesterday') return published === shiftDateKey(today, -1);
  if (range === '7d') return published >= shiftDateKey(today, -6) && published <= today;
  if (range === '30d') return published >= shiftDateKey(today, -29) && published <= today;
  return published === customDate;
}

function aggregate<T extends { path: string; views: number }>(
  rows: T[],
  allowedPaths: Set<string>,
  key: (row: T) => string
) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!allowedPaths.has(normalizePath(row.path))) continue;
    const label = key(row);
    totals.set(label, (totals.get(label) || 0) + row.views);
  }
  return [...totals.entries()]
    .map(([label, views]) => ({ label, views }))
    .sort((a, b) => b.views - a.views);
}

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const period = (params.period && params.period in ANALYTICS_PERIODS ? params.period : '28d') as AnalyticsPeriodKey;
  const published = (params.published && params.published in PUBLISH_RANGES ? params.published : 'all') as PublishRangeKey;
  const today = aucklandDateKey(new Date());
  const customDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date || '') ? params.date! : today;

  const { supabase } = await requireAdmin();
  const [{ data: articleData, error: articleError }, analytics] = await Promise.all([
    supabase
      .from('articles')
      .select('id,title,slug,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(2000),
    getStoryAnalytics(period),
  ]);

  if (articleError) throw articleError;

  const allArticles = (articleData || []) as ArticleRow[];
  const filteredArticles = allArticles.filter((article) => inPublishRange(article, published, customDate, today));
  const filteredBySlug = new Map(filteredArticles.map((article) => [article.slug, article]));
  const selectedArticle = params.story ? filteredBySlug.get(params.story) : undefined;

  const pagePerformance = new Map<string, { views: number; users: number }>();
  for (const page of analytics.pages) {
    const path = normalizePath(page.path);
    const existing = pagePerformance.get(path) || { views: 0, users: 0 };
    existing.views += page.views;
    existing.users += page.users;
    pagePerformance.set(path, existing);
  }

  const storyRows = filteredArticles
    .map((article) => {
      const performance = pagePerformance.get(normalizePath(`/${article.slug}`)) || { views: 0, users: 0 };
      return { ...article, ...performance };
    })
    .sort((a, b) => b.views - a.views || String(b.published_at || '').localeCompare(String(a.published_at || '')));

  const scopedArticles = selectedArticle ? [selectedArticle] : filteredArticles;
  const allowedPaths = new Set(scopedArticles.map((article) => normalizePath(`/${article.slug}`)));

  const trendTotals = new Map<string, number>();
  for (const row of analytics.trend) {
    if (!allowedPaths.has(normalizePath(row.path))) continue;
    trendTotals.set(row.date, (trendTotals.get(row.date) || 0) + row.views);
  }
  const trend = periodDateKeys(period, today).map((date) => ({ date, views: trendTotals.get(date) || 0 }));
  const trendMax = Math.max(1, ...trend.map((item) => item.views));

  const channels = aggregate<(typeof analytics.channels)[number]>(analytics.channels, allowedPaths, (row) => row.channel).slice(0, 8);
  const sources = aggregate<(typeof analytics.sources)[number]>(analytics.sources, allowedPaths, (row) => row.source).slice(0, 10);
  const countries = aggregate<(typeof analytics.countries)[number]>(analytics.countries, allowedPaths, (row) => row.country).slice(0, 12);
  const channelMax = Math.max(1, ...channels.map((item) => item.views));
  const countryMax = Math.max(1, ...countries.map((item) => item.views));

  const scopedStoryRows = selectedArticle
    ? storyRows.filter((row) => row.slug === selectedArticle.slug)
    : storyRows;
  const totalViews = scopedStoryRows.reduce((sum, row) => sum + row.views, 0);
  const topStory = storyRows[0];
  const selectedPerformance = selectedArticle
    ? pagePerformance.get(normalizePath(`/${selectedArticle.slug}`)) || { views: 0, users: 0 }
    : null;
  const averageViews = scopedStoryRows.length ? totalViews / scopedStoryRows.length : 0;

  const filterQuery = new URLSearchParams({ period, published, date: customDate });
  const clearStoryHref = `/admin/analytics?${filterQuery.toString()}`;
  const contextLabel = selectedArticle ? `Selected story: ${selectedArticle.title}` : PUBLISH_RANGES[published];

  return (
    <AdminShell active="Analytics">
      <AdminHeader
        title="Story Analytics"
        description="See which Webfit News stories are being read, where readers come from, and which traffic channels are working."
        actions={<a className="admin-secondary" href={analytics.analyticsUrl} target="_blank" rel="noreferrer">Open Google Analytics</a>}
      />

      <section className="admin-card story-analytics-filter-card">
        <form method="get" className="story-analytics-filters">
          <label>
            <span>Views period</span>
            <select name="period" defaultValue={period}>
              {(Object.keys(ANALYTICS_PERIODS) as AnalyticsPeriodKey[]).map((key) => (
                <option value={key} key={key}>{ANALYTICS_PERIODS[key]}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Stories</span>
            <select name="published" defaultValue={published}>
              {(Object.keys(PUBLISH_RANGES) as PublishRangeKey[]).map((key) => (
                <option value={key} key={key}>{PUBLISH_RANGES[key]}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Specific publish date</span>
            <input type="date" name="date" defaultValue={customDate} />
          </label>
          {selectedArticle ? <input type="hidden" name="story" value={selectedArticle.slug} /> : null}
          <button className="admin-primary" type="submit">Apply filters</button>
          <Link className="admin-secondary" href="/admin/analytics">Reset</Link>
        </form>
        <div className="story-analytics-filter-note">
          <span><strong>Reporting:</strong> {analytics.periodLabel}</span>
          <span><strong>Story set:</strong> {contextLabel}</span>
          {selectedArticle ? <Link href={clearStoryHref}>Clear story drill-down</Link> : null}
        </div>
      </section>

      {!analytics.configured ? (
        <section className="story-analytics-alert">
          <strong>GA4 reporting is not available.</strong>
          <span>{analytics.error || 'Check the server-side Google Analytics reporting configuration.'}</span>
        </section>
      ) : null}

      {analytics.warnings.length ? (
        <section className="story-analytics-warning">
          <strong>Some analytics breakdowns could not be loaded.</strong>
          <span>{analytics.warnings.join(' | ')}</span>
        </section>
      ) : null}

      <section className="story-analytics-metrics">
        <article><span>Story views</span><strong>{compact(totalViews)}</strong><small>{selectedArticle ? 'Selected story' : analytics.periodLabel}</small></article>
        <article><span>Stories in filter</span><strong>{scopedStoryRows.length}</strong><small>{PUBLISH_RANGES[published]}</small></article>
        {selectedArticle ? (
          <article><span>Readers</span><strong>{compact(selectedPerformance?.users || 0)}</strong><small>Unique users for this page</small></article>
        ) : (
          <article><span>Average views</span><strong>{compact(Math.round(averageViews))}</strong><small>Per story in this filter</small></article>
        )}
        <article><span>Countries</span><strong>{countries.length}</strong><small>Top countries with story traffic</small></article>
      </section>

      <section className="story-analytics-grid story-analytics-grid-wide">
        <div className="admin-card story-analytics-card">
          <div className="story-analytics-card-head">
            <div><h2>Traffic trend</h2><p>{selectedArticle ? selectedArticle.title : 'All stories in the current story filter'}</p></div>
            <strong>{compact(totalViews)} views</strong>
          </div>
          {trend.length ? (
            <div className="story-analytics-trend" aria-label="Story view trend">
              {trend.map((item) => (
                <div className="story-analytics-trend-item" key={item.date} title={`${formatGaDate(item.date)}: ${item.views} views`}>
                  <div className="story-analytics-trend-track"><span style={{ height: `${Math.max(item.views ? 5 : 1, (item.views / trendMax) * 100)}%` }} /></div>
                  <small>{formatGaDate(item.date)}</small>
                </div>
              ))}
            </div>
          ) : <p className="story-analytics-empty">No traffic in this period.</p>}
        </div>

        <div className="admin-card story-analytics-card story-analytics-top-story">
          <div className="story-analytics-card-head"><div><h2>{selectedArticle ? 'Selected story' : 'Top story'}</h2><p>By page views in this reporting period</p></div></div>
          {selectedArticle ? (
            <>
              <h3>{selectedArticle.title}</h3>
              <div className="story-analytics-big-number">{compact(selectedPerformance?.views || 0)} <span>views</span></div>
              <p>Published {formatPublished(selectedArticle.published_at)}</p>
              <a className="admin-secondary" href={`/${selectedArticle.slug}/`} target="_blank" rel="noreferrer">Open story</a>
            </>
          ) : topStory ? (
            <>
              <h3>{topStory.title}</h3>
              <div className="story-analytics-big-number">{compact(topStory.views)} <span>views</span></div>
              <p>Published {formatPublished(topStory.published_at)}</p>
              <Link className="admin-secondary" href={`/admin/analytics?${filterQuery.toString()}&story=${encodeURIComponent(topStory.slug)}`}>Inspect story</Link>
            </>
          ) : <p className="story-analytics-empty">No published stories match this filter.</p>}
        </div>
      </section>

      <section className="story-analytics-grid">
        <div className="admin-card story-analytics-card">
          <div className="story-analytics-card-head"><div><h2>Traffic channels</h2><p>Direct, social, search, referral and other channels</p></div></div>
          {channels.length ? channels.map((item) => (
            <div className="story-analytics-rank" key={item.label}>
              <div><strong>{item.label}</strong><span>{compact(item.views)} views</span></div>
              <div className="story-analytics-track"><span style={{ width: `${Math.max(2, (item.views / channelMax) * 100)}%` }} /></div>
            </div>
          )) : <p className="story-analytics-empty">No channel data for these stories.</p>}
        </div>

        <div className="admin-card story-analytics-card">
          <div className="story-analytics-card-head"><div><h2>Top countries</h2><p>Country-level story traffic. City and device data are intentionally excluded for now.</p></div></div>
          {countries.length ? countries.map((item) => (
            <div className="story-analytics-rank" key={item.label}>
              <div><strong>{item.label}</strong><span>{compact(item.views)} views</span></div>
              <div className="story-analytics-track"><span style={{ width: `${Math.max(2, (item.views / countryMax) * 100)}%` }} /></div>
            </div>
          )) : <p className="story-analytics-empty">No country data for these stories.</p>}
        </div>
      </section>

      <section className="admin-card story-analytics-card">
        <div className="story-analytics-card-head">
          <div><h2>Traffic sources</h2><p>Referrer/source and medium behind story traffic</p></div>
          <small>{selectedArticle ? 'Selected story' : 'Current story filter'}</small>
        </div>
        {sources.length ? (
          <div className="story-analytics-source-grid">
            {sources.map((item, index) => (
              <div key={item.label}><span>{index + 1}</span><strong>{item.label}</strong><b>{compact(item.views)}</b></div>
            ))}
          </div>
        ) : <p className="story-analytics-empty">No source data for these stories.</p>}
      </section>

      <section className="admin-card story-analytics-card">
        <div className="story-analytics-card-head">
          <div><h2>Story performance</h2><p>Every published story in the current publish-date filter, including stories with zero measured views.</p></div>
          <strong>{storyRows.length} stories</strong>
        </div>
        <div className="admin-table-wrap">
          <table className="story-analytics-table">
            <thead><tr><th>Story</th><th>Published</th><th>Views</th><th>Readers</th><th>Views / reader</th><th>Drill-down</th></tr></thead>
            <tbody>
              {storyRows.length ? storyRows.map((row) => (
                <tr key={row.id} className={selectedArticle?.slug === row.slug ? 'is-selected' : ''}>
                  <td><strong>{row.title}</strong><small>/{row.slug}/</small></td>
                  <td>{formatPublished(row.published_at)}</td>
                  <td><strong>{compact(row.views)}</strong></td>
                  <td>{compact(row.users)}</td>
                  <td>{row.users ? (row.views / row.users).toFixed(1) : '0.0'}</td>
                  <td><Link className="admin-secondary" href={`/admin/analytics?${filterQuery.toString()}&story=${encodeURIComponent(row.slug)}`}>Inspect</Link></td>
                </tr>
              )) : <tr><td colSpan={6}>No published stories match this filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <p className="story-analytics-footnote">
        Views come from the existing GA4 page-view stream. Repeated views are counted. Country and traffic-source data use GA4's aggregated reporting, and no new device or IP tracking was added for this dashboard.
      </p>
    </AdminShell>
  );
}
