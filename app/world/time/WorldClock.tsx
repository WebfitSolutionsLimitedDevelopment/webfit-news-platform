'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './time.module.css';

type City = { city: string; country: string; zone: string };

const CITIES: City[] = [
  { city: 'Auckland', country: 'New Zealand', zone: 'Pacific/Auckland' },
  { city: 'Wellington', country: 'New Zealand', zone: 'Pacific/Auckland' },
  { city: 'Sydney', country: 'Australia', zone: 'Australia/Sydney' },
  { city: 'Melbourne', country: 'Australia', zone: 'Australia/Melbourne' },
  { city: 'Delhi', country: 'India', zone: 'Asia/Kolkata' },
  { city: 'Mumbai', country: 'India', zone: 'Asia/Kolkata' },
  { city: 'Singapore', country: 'Singapore', zone: 'Asia/Singapore' },
  { city: 'Dubai', country: 'United Arab Emirates', zone: 'Asia/Dubai' },
  { city: 'Tokyo', country: 'Japan', zone: 'Asia/Tokyo' },
  { city: 'Seoul', country: 'South Korea', zone: 'Asia/Seoul' },
  { city: 'London', country: 'United Kingdom', zone: 'Europe/London' },
  { city: 'Paris', country: 'France', zone: 'Europe/Paris' },
  { city: 'Berlin', country: 'Germany', zone: 'Europe/Berlin' },
  { city: 'New York', country: 'United States', zone: 'America/New_York' },
  { city: 'Los Angeles', country: 'United States', zone: 'America/Los_Angeles' },
  { city: 'Toronto', country: 'Canada', zone: 'America/Toronto' },
  { city: 'Vancouver', country: 'Canada', zone: 'America/Vancouver' },
  { city: 'Honolulu', country: 'United States', zone: 'Pacific/Honolulu' },
  { city: 'Johannesburg', country: 'South Africa', zone: 'Africa/Johannesburg' },
  { city: 'São Paulo', country: 'Brazil', zone: 'America/Sao_Paulo' },
];

function parts(date: Date, zone: string) {
  const time = new Intl.DateTimeFormat('en-NZ', {
    timeZone: zone,
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  }).format(date);
  const fullDate = new Intl.DateTimeFormat('en-NZ', {
    timeZone: zone,
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
  const zoneName = new Intl.DateTimeFormat('en-NZ', {
    timeZone: zone,
    timeZoneName: 'short', hour: '2-digit',
  }).formatToParts(date).find((p) => p.type === 'timeZoneName')?.value || zone;
  return { time, fullDate, zoneName };
}

export default function WorldClock() {
  const [now, setNow] = useState(() => new Date());
  const [query, setQuery] = useState('');

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CITIES;
    return CITIES.filter((item) => `${item.city} ${item.country} ${item.zone}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <section>
      <div className={styles.searchBox}>
        <label htmlFor="world-time-search">Search city or country</label>
        <input id="world-time-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try Auckland, India, London, New York..." />
      </div>

      <div className={styles.grid} aria-live="polite">
        {filtered.map((item) => {
          const value = parts(now, item.zone);
          return (
            <article key={`${item.city}-${item.zone}`} className={styles.card}>
              <div className={styles.country}>{item.country}</div>
              <h2>{item.city}</h2>
              <div className={styles.time}>{value.time}</div>
              <div className={styles.date}>{value.fullDate}</div>
              <div className={styles.zone}>{value.zoneName} · {item.zone}</div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 ? <p className={styles.empty}>No matching city in the current directory. Try a country or another major city.</p> : null}
    </section>
  );
}
