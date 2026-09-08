'use client';

import styles from '@/components/UtilityGuide.module.css';

type Holiday = { name: string; date: string; observed?: string };
type Anniversary = { region: string; observed: string };

const MONTHS: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

function nzTodayKey() {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function dateKey(value: string, year: number) {
  const match = value.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?\s*(\d{1,2})\s+([A-Za-z]+)/);
  if (!match) return null;
  const month = MONTHS[match[2]];
  if (month === undefined) return null;
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`;
}

function statusFor(value: string, year: number) {
  const key = dateKey(value, year);
  if (!key) return 'upcoming' as const;
  const today = nzTodayKey();
  if (key < today) return 'past' as const;
  if (key === today) return 'today' as const;
  return 'upcoming' as const;
}

function StatusBadge({ status }: { status: 'past' | 'today' | 'upcoming' }) {
  const label = status === 'past' ? 'Past' : status === 'today' ? 'Today' : 'Upcoming';
  return <span className={`${styles.statusBadge} ${styles[status]}`}>{label}</span>;
}

export function NationalHolidayTable({ year, holidays }: { year: number; holidays: Holiday[] }) {
  return <div className={styles.tableWrap}>
    <table className={styles.table}>
      <thead><tr><th>Status</th><th>Public holiday</th><th>Calendar date</th><th>Observed date</th></tr></thead>
      <tbody>{holidays.map((holiday) => {
        const status = statusFor(holiday.observed || holiday.date, year);
        return <tr key={`${year}-${holiday.name}`} className={styles[`${status}Row`]}>
          <td><StatusBadge status={status}/></td>
          <td className={`${styles.highlight} ${status === 'past' ? styles.pastText : ''}`}>{holiday.name}</td>
          <td className={status === 'past' ? styles.pastText : ''}>{holiday.date}</td>
          <td className={status === 'past' ? styles.pastText : ''}>{holiday.observed || 'Same day'}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

export function AnniversaryTable({ year, items }: { year: number; items: Anniversary[] }) {
  return <div className={styles.tableWrap}>
    <table className={styles.table}>
      <thead><tr><th>Status</th><th>Region</th><th>{year} observed</th></tr></thead>
      <tbody>{items.map((item) => {
        const status = statusFor(item.observed, year);
        return <tr key={item.region} className={styles[`${status}Row`]}>
          <td><StatusBadge status={status}/></td>
          <td className={`${styles.highlight} ${status === 'past' ? styles.pastText : ''}`}>{item.region}</td>
          <td className={status === 'past' ? styles.pastText : ''}>{item.observed}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
