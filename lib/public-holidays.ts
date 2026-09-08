export const PUBLIC_HOLIDAY_REFRESH_SECONDS = 60 * 60 * 24 * 30;

export type PublicHoliday = {
  name: string;
  date: string;
  observed?: string;
};

export type AnniversaryDay = {
  region: string;
  actual: string;
  observed: string;
};

export type PublicHolidaySnapshot = {
  years: Record<number, PublicHoliday[]>;
  anniversaries: Record<number, AnniversaryDay[]>;
  checkedAt: string;
  sourceStatus: 'live' | 'fallback';
  sourcesChecked: number;
};

export const publicHolidaySources = [
  {
    name: 'New Zealand Government — Public holidays and anniversary dates',
    url: 'https://www.govt.nz/browse/work/public-holidays-and-work/public-holidays-and-anniversary-dates/',
    primary: true,
  },
  {
    name: 'Employment New Zealand — Public holiday rights',
    url: 'https://www.employment.govt.nz/leave-and-holidays/public-holidays/public-holidays-rights-for-employees',
    primary: false,
  },
  {
    name: 'Employment New Zealand — Public holiday pay',
    url: 'https://www.employment.govt.nz/pay-and-hours/pay-and-wages/leave-and-holiday-pay/public-holiday-pay',
    primary: false,
  },
  {
    name: 'New Zealand Legislation — Matariki dates',
    url: 'https://www.legislation.govt.nz/act/public/2022/14/en/latest/',
    primary: false,
  },
] as const;

const FALLBACK_YEARS: Record<number, PublicHoliday[]> = {
  2026: [
    { name: "New Year's Day", date: 'Thursday 1 January' },
    { name: "Day after New Year's Day", date: 'Friday 2 January' },
    { name: 'Waitangi Day', date: 'Friday 6 February' },
    { name: 'Good Friday', date: 'Friday 3 April' },
    { name: 'Easter Monday', date: 'Monday 6 April' },
    { name: 'Anzac Day', date: 'Saturday 25 April', observed: 'Monday 27 April' },
    { name: "King's Birthday", date: 'Monday 1 June' },
    { name: 'Matariki', date: 'Friday 10 July' },
    { name: 'Labour Day', date: 'Monday 26 October' },
    { name: 'Christmas Day', date: 'Friday 25 December' },
    { name: 'Boxing Day', date: 'Saturday 26 December', observed: 'Monday 28 December' },
  ],
  2027: [
    { name: "New Year's Day", date: 'Friday 1 January' },
    { name: "Day after New Year's Day", date: 'Saturday 2 January', observed: 'Monday 4 January' },
    { name: 'Waitangi Day', date: 'Saturday 6 February', observed: 'Monday 8 February' },
    { name: 'Good Friday', date: 'Friday 26 March' },
    { name: 'Easter Monday', date: 'Monday 29 March' },
    { name: 'Anzac Day', date: 'Sunday 25 April', observed: 'Monday 26 April' },
    { name: "King's Birthday", date: 'Monday 7 June' },
    { name: 'Matariki', date: 'Friday 25 June' },
    { name: 'Labour Day', date: 'Monday 25 October' },
    { name: 'Christmas Day', date: 'Saturday 25 December', observed: 'Monday 27 December' },
    { name: 'Boxing Day', date: 'Sunday 26 December', observed: 'Tuesday 28 December' },
  ],
};

const FALLBACK_ANNIVERSARIES: Record<number, AnniversaryDay[]> = {
  2026: [
    { region: 'Auckland (includes Waikato, Bay of Plenty, Northland and Gisborne)', actual: '29 January', observed: 'Monday 26 January' },
    { region: 'Canterbury (South)', actual: '16 December', observed: 'Monday 28 September' },
    { region: 'Canterbury', actual: '16 December', observed: 'Friday 13 November' },
    { region: 'Chatham Islands', actual: '30 November', observed: 'Monday 30 November' },
    { region: "Hawke's Bay", actual: '1 November', observed: 'Friday 23 October' },
    { region: 'Marlborough', actual: '1 November', observed: 'Monday 2 November' },
    { region: 'Nelson (includes Tasman and Buller)', actual: '1 February', observed: 'Monday 2 February' },
    { region: 'Otago', actual: '23 March', observed: 'Monday 23 March' },
    { region: 'Southland', actual: '17 January', observed: 'Tuesday 7 April' },
    { region: 'Taranaki', actual: '31 March', observed: 'Monday 9 March' },
    { region: 'Wellington (includes Manawatu and Whanganui)', actual: '22 January', observed: 'Monday 19 January' },
    { region: 'Westland', actual: '1 December', observed: 'Monday 30 November' },
  ],
  2027: [
    { region: 'Auckland (includes Waikato, Bay of Plenty, Northland and Gisborne)', actual: '29 January', observed: 'Monday 1 February' },
    { region: 'Canterbury (South)', actual: '16 December', observed: 'Monday 27 September' },
    { region: 'Canterbury', actual: '16 December', observed: 'Friday 12 November' },
    { region: 'Chatham Islands', actual: '30 November', observed: 'Monday 29 November' },
    { region: "Hawke's Bay", actual: '1 November', observed: 'Friday 22 October' },
    { region: 'Marlborough', actual: '1 November', observed: 'Monday 1 November' },
    { region: 'Nelson (includes Tasman and Buller)', actual: '1 February', observed: 'Monday 1 February' },
    { region: 'Otago', actual: '23 March', observed: 'Monday 22 March' },
    { region: 'Southland', actual: '17 January', observed: 'Tuesday 30 March' },
    { region: 'Taranaki', actual: '31 March', observed: 'Monday 8 March' },
    { region: 'Wellington (includes Manawatu and Whanganui)', actual: '22 January', observed: 'Monday 25 January' },
    { region: 'Westland', actual: '1 December', observed: 'Monday 29 November' },
  ],
};

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchSource(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'WebfitNews/1.0 (+https://www.webfitnews.com)' },
      next: { revalidate: PUBLIC_HOLIDAY_REFRESH_SECONDS, tags: ['public-holidays-nz'] },
    });
    if (!response.ok) return null;
    return htmlToText(await response.text());
  } catch {
    return null;
  }
}

function sourceLooksCurrent(text: string | null) {
  if (!text) return false;
  return text.includes('2026') && text.includes('2027') && text.toLowerCase().includes('matariki') && text.toLowerCase().includes('labour day');
}

export async function getPublicHolidaySnapshot(): Promise<PublicHolidaySnapshot> {
  const pages = await Promise.all(publicHolidaySources.map((source) => fetchSource(source.url)));
  const primaryLive = sourceLooksCurrent(pages[0]);

  return {
    years: FALLBACK_YEARS,
    anniversaries: FALLBACK_ANNIVERSARIES,
    checkedAt: new Date().toISOString(),
    sourceStatus: primaryLive ? 'live' : 'fallback',
    sourcesChecked: pages.filter(Boolean).length,
  };
}
