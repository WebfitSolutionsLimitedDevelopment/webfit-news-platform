import { GoogleAuth } from 'google-auth-library';

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || '513218152';
const ANALYTICS_URL = `https://analytics.google.com/analytics/web/#/p${PROPERTY_ID}/reports/intelligenthome`;

type ReportRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

type RunReportResponse = {
  rows?: ReportRow[];
  totals?: ReportRow[];
};

export type GoogleAnalyticsDashboard = {
  configured: boolean;
  propertyId: string;
  analyticsUrl: string;
  error?: string;
  realtimeUsers: number;
  users7d: number;
  users28d: number;
  views7d: number;
  views28d: number;
  sessions28d: number;
  averageSessionDuration: number;
  trend: Array<{ date: string; users: number; views: number }>;
  topPages: Array<{ path: string; title: string; views: number }>;
  sources: Array<{ source: string; sessions: number }>;
  devices: Array<{ device: string; users: number }>;
};

const emptyDashboard = (error?: string): GoogleAnalyticsDashboard => ({
  configured: false,
  propertyId: PROPERTY_ID,
  analyticsUrl: ANALYTICS_URL,
  error,
  realtimeUsers: 0,
  users7d: 0,
  users28d: 0,
  views7d: 0,
  views28d: 0,
  sessions28d: 0,
  averageSessionDuration: 0,
  trend: [],
  topPages: [],
  sources: [],
  devices: [],
});

function number(value?: string) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function analyticsPost(path: string, token: string, body: unknown) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:${path}`,
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

export async function getGoogleAnalyticsDashboard(): Promise<GoogleAnalyticsDashboard> {
  const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    return emptyDashboard(
      'Add the Google Analytics service-account credentials in Vercel to display live reporting.'
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

    if (!token) {
      throw new Error('Google Analytics access token could not be created.');
    }

    const [summary7, summary28, trend, pages, sources, devices, realtime] = await Promise.all([
      analyticsPost('runReport', token, {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
      }),
      analyticsPost('runReport', token, {
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'sessions' },
          { name: 'averageSessionDuration' },
        ],
      }),
      analyticsPost('runReport', token, {
        dateRanges: [{ startDate: '27daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      analyticsPost('runReport', token, {
        dateRanges: [{ startDate: '27daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: '10',
      }),
      analyticsPost('runReport', token, {
        dateRanges: [{ startDate: '27daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: '8',
      }),
      analyticsPost('runReport', token, {
        dateRanges: [{ startDate: '27daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      }),
      analyticsPost('runRealtimeReport', token, {
        metrics: [{ name: 'activeUsers' }],
      }),
    ]);

    const row7 = summary7.rows?.[0]?.metricValues || [];
    const row28 = summary28.rows?.[0]?.metricValues || [];
    const realtimeValues =
      realtime.rows?.[0]?.metricValues ||
      realtime.totals?.[0]?.metricValues ||
      [];

    return {
      configured: true,
      propertyId: PROPERTY_ID,
      analyticsUrl: ANALYTICS_URL,
      realtimeUsers: number(realtimeValues[0]?.value),
      users7d: number(row7[0]?.value),
      views7d: number(row7[1]?.value),
      users28d: number(row28[0]?.value),
      views28d: number(row28[1]?.value),
      sessions28d: number(row28[2]?.value),
      averageSessionDuration: number(row28[3]?.value),
      trend: (trend.rows || []).map((row) => ({
        date: row.dimensionValues?.[0]?.value || '',
        users: number(row.metricValues?.[0]?.value),
        views: number(row.metricValues?.[1]?.value),
      })),
      topPages: (pages.rows || []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || '/',
        title:
          row.dimensionValues?.[1]?.value ||
          row.dimensionValues?.[0]?.value ||
          'Untitled page',
        views: number(row.metricValues?.[0]?.value),
      })),
      sources: (sources.rows || []).map((row) => ({
        source: row.dimensionValues?.[0]?.value || 'Direct / unknown',
        sessions: number(row.metricValues?.[0]?.value),
      })),
      devices: (devices.rows || []).map((row) => ({
        device: row.dimensionValues?.[0]?.value || 'unknown',
        users: number(row.metricValues?.[0]?.value),
      })),
    };
  } catch (error) {
    return emptyDashboard(
      error instanceof Error ? error.message : 'Google Analytics could not be loaded.'
    );
  }
}
