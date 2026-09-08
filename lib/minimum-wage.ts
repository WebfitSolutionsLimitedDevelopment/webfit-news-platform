export const MINIMUM_WAGE_REFRESH_SECONDS = 60 * 60 * 48;

export type MinimumWageSnapshot = {
  adultHourly: number;
  startingOutHourly: number;
  trainingHourly: number;
  effectiveFrom: string;
  checkedAt: string;
  sourceStatus: 'live' | 'fallback';
  sourcesChecked: number;
};

const FALLBACK: Omit<MinimumWageSnapshot, 'checkedAt' | 'sourceStatus' | 'sourcesChecked'> = {
  adultHourly: 23.95,
  startingOutHourly: 19.16,
  trainingHourly: 19.16,
  effectiveFrom: '2026-04-01',
};

export const minimumWageSources = [
  {
    name: 'Employment New Zealand — Minimum wage rates and types',
    url: 'https://www.employment.govt.nz/pay-and-hours/pay-and-wages/minimum-wage/minimum-wage-rates-and-types',
    primary: true,
  },
  {
    name: 'Employment New Zealand — 1 April 2026 increase',
    url: 'https://www.employment.govt.nz/news-and-updates/minimum-wage-is-increasing-on-1-april-2026',
    primary: false,
  },
  {
    name: 'New Zealand Legislation — Minimum Wage Order 2026',
    url: 'https://www.legislation.govt.nz/regulation/public/2026/0016/latest/whole.html',
    primary: false,
  },
  {
    name: 'MBIE — Minimum wage reviews',
    url: 'https://www.mbie.govt.nz/business-and-employment/employment-and-skills/employment-legislation-reviews/minimum-wage-reviews',
    primary: false,
  },
  {
    name: 'Business.govt.nz — Minimum wage and fair pay',
    url: 'https://www.business.govt.nz/people-and-leave/having-a-fair-workplace/minimum-wage-and-fair-pay',
    primary: false,
  },
] as const;

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#36;|&dollar;/gi, '$')
    .replace(/\s+/g, ' ')
    .trim();
}

function rateNear(text: string, label: string): number | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`${escaped}.{0,220}?\\$\\s*(\\d{2}\\.\\d{2})`, 'i'),
    new RegExp(`\\$\\s*(\\d{2}\\.\\d{2}).{0,220}?${escaped}`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }
  return null;
}

async function fetchSource(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'WebfitNews/1.0 (+https://www.webfitnews.com)' },
      next: { revalidate: MINIMUM_WAGE_REFRESH_SECONDS, tags: ['minimum-wage-nz'] },
    });
    if (!response.ok) return null;
    return htmlToText(await response.text());
  } catch {
    return null;
  }
}

export async function getMinimumWageSnapshot(): Promise<MinimumWageSnapshot> {
  const pages = await Promise.all(minimumWageSources.map((source) => fetchSource(source.url)));
  const primary = pages[0];

  let adultHourly = primary ? rateNear(primary, 'Adult') : null;
  let startingOutHourly = primary ? rateNear(primary, 'Starting-out') : null;
  let trainingHourly = primary ? rateNear(primary, 'Training') : null;

  // If Employment NZ changes its markup, use other official pages as a secondary parser.
  for (const page of pages.slice(1)) {
    if (!page) continue;
    adultHourly ??= rateNear(page, 'adult minimum wage') ?? rateNear(page, 'adult worker');
    startingOutHourly ??= rateNear(page, 'starting-out minimum wage') ?? rateNear(page, 'starting-out worker');
    trainingHourly ??= rateNear(page, 'training minimum wage') ?? rateNear(page, 'trainee');
  }

  const live = Boolean(adultHourly && startingOutHourly && trainingHourly);

  return {
    adultHourly: adultHourly ?? FALLBACK.adultHourly,
    startingOutHourly: startingOutHourly ?? FALLBACK.startingOutHourly,
    trainingHourly: trainingHourly ?? FALLBACK.trainingHourly,
    effectiveFrom: FALLBACK.effectiveFrom,
    checkedAt: new Date().toISOString(),
    sourceStatus: live ? 'live' : 'fallback',
    sourcesChecked: pages.filter(Boolean).length,
  };
}
