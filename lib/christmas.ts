/**
 * New Zealand Christmas dates. NZ is on daylight time (UTC+13) every
 * December, so Christmas Day runs 25 Dec 00:00 to 26 Dec 00:00 at +13:00.
 */
export function nzYear(now: Date = new Date()) {
  return Number(new Intl.DateTimeFormat('en-NZ', { year: 'numeric', timeZone: 'Pacific/Auckland' }).format(now));
}
export function christmasStart(year: number) { return new Date(`${year}-12-25T00:00:00+13:00`); }
export function christmasEnd(year: number) { return new Date(`${year}-12-26T00:00:00+13:00`); }

/** The countdown runs from 1 November until the end of Christmas Day, NZ time. */
export function christmasCountdownActive(now: Date = new Date()) {
  const year = nzYear(now);
  const opens = new Date(`${year}-11-01T00:00:00+13:00`);
  return now >= opens && now < christmasEnd(year);
}
