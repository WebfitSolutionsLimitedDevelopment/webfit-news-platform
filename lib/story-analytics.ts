import { GoogleAuth } from 'google-auth-library';

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || '513218152';
const ANALYTICS_URL = `https://analytics.google.com/analytics/web/#/p${PROPERTY_ID}/reports/intelligenthome`;

export type AnalyticsPeriodKey = 'today' | 'yesterday' | '7d' | '28d' | '90d';

export const ANALYTICS_PERIODS: Record<AnalyticsPeriodKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 days',
  '28d': 'Last 28 days',
  '90d': 'Last 90 days',
};

type ReportRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

type RunReportResponse = {
  rows?: ReportRow[];
  rowCount?: number;
};

export type StoryAnalyticsReport = {
  configured: boolean;
  propertyId: string;
  analyticsUrl: string;
  period: AnalyticsPeriodKey;
  periodLabel: string;
  error?: string;
  warnings: string[];
  pages: Array<{ path: string; title: string; views: number; users: number }>;
  trend: Array<{ date: string; path: string; views: number }>;
  channels: Array<{ path: string; channel: string; views: number }>;
  sources: Array<{ path: string; source: string; views: number }>;
  countries: Array<{ path: string; country: string; views: number }>;
};

function numeric(value?: string) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateRange(period: AnalyticsPeriodKey) {
  switch (period) {
    case 'today':
      return { startDate: 'today', endDate: 'today' };
    case 'yesterday':
      return { startDate: 'yesterday', endDate: 'yesterday' };
    case '7d':
      return { startDate: '6daysAgo', endDate: 'today' };
    case '90d':
      return { startDate: '89daysAgo', endDate: 'today' };
    case '28d':
    default:
      return { startDate: '27daysAgo', endDate: 'today' };
  }
}

function emptyReport(period: AnalyticsPeriodKey, error?: string): StoryAnalyticsReport {
  return {
    configured: false,
    propertyId: PROPERTY_ID,
    analyticsUrl: ANALYTICS_URL,
    period,
    periodLabel: ANALYTICS_PERIODS[period],
    error,
    warnings: [],
    pages: [],
    trend: [],
    channels: [],
    sources: [],
    countries: [],
  };
}

async function analyticsPost(token: string, body: unknown) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Google Analytics API returned ${response.status}`);
  }
  return data as RunReportResponse;
}

async function safeReport(token: string, label: string, body: unknown) {
  try {
    return { data: await analyticsPost(token, body), warning: undefined as string | undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown reporting error';
    return { data: {} as RunReportResponse, warning: `${label}: ${message}` };
  }
}

export async function getStoryAnalytics(period: AnalyticsPeriodKey): Promise<StoryAnalyticsReport> {
  const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    return emptyReport(
      period,
      'Google Analytics service-account credentials are not configured for server-side reporting.'
    );
  }

  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    const token = typeof accessToken === 'string' ? accessToken : accessToken?.token;
    if (!token) throw new Error('Google Analytics access token could not be created.');

    const range = dateRange(period);
    const common = { dateRanges: [range], limit: '250000' };

    const [pagesResult, trendResult, channelsResult, sourcesResult, countriesResult] = await Promise.all([
      safeReport(token, 'Story performance', {
        ...common,
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      }),
      safeReport(token, 'Traffic trend', {
        ...common,
        dimensions: [{ name: 'date' }, { name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      safeReport(token, 'Traffic channels', {
        ...common,
        dimensions: [{ name: 'pagePath' }, { name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      }),
      safeReport(token, 'Traffic sources', {
        ...common,
        dimensions: [{ name: 'pagePath' }, { name: 'sessionSourceMedium' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      }),
      safeReport(token, 'Countries', {
        ...common,
        dimensions: [{ name: 'pagePath' }, { name: 'country' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      }),
    ]);

    const warnings = [
      pagesResult.warning,
      trendResult.warning,
      channelsResult.warning,
      sourcesResult.warning,
      countriesResult.warning,
    ].filter((value): value is string => Boolean(value));

    return {
      configured: true,
      propertyId: PROPERTY_ID,
      analyticsUrl: ANALYTICS_URL,
      period,
      periodLabel: ANALYTICS_PERIODS[period],
      warnings,
      pages: (pagesResult.data.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || '/',
        title: row.dimensionValues?.[1]?.value || row.dimensionValues?.[0]?.value || 'Untitled page',
        views: numeric(row.metricValues?.[0]?.value),
        users: numeric(row.metricValues?.[1]?.value),
      })),
      trend: (trendResult.data.rows || []).map((row) => ({
        date: row.dimensionValues?.[0]?.value || '',
        path: row.dimensionValues?.[1]?.value || '/',
        views: numeric(row.metricValues?.[0]?.value),
      })),
      channels: (channelsResult.data.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || '/',
        channel: row.dimensionValues?.[1]?.value || 'Unassigned',
        views: numeric(row.metricValues?.[0]?.value),
      })),
      sources: (sourcesResult.data.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || '/',
        source: row.dimensionValues?.[1]?.value || 'Direct / unknown',
        views: numeric(row.metricValues?.[0]?.value),
      })),
      countries: (countriesResult.data.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || '/',
        country: row.dimensionValues?.[1]?.value || 'Unknown',
        views: numeric(row.metricValues?.[0]?.value),
      })),
    };
  } catch (error) {
    return emptyReport(
      period,
      error instanceof Error ? error.message : 'Google Analytics could not be loaded.'
    );
  }
}
