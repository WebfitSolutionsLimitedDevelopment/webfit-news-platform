"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./sports.module.css";

export type SportsEvent = {
  name: string;
  sport: string;
  location: string;
  start: string;
  end: string;
  dateLabel: string;
  description: string;
  officialUrl: string;
  officialLabel: string;
};

function dayDiff(a: Date, b: Date) {
  return Math.ceil((a.getTime() - b.getTime()) / 86400000);
}

function getStatus(event: SportsEvent, now: Date | null) {
  if (!now) return { label: "Checking date…", tone: "neutral", detail: "" };
  const start = new Date(`${event.start}T00:00:00Z`);
  const end = new Date(`${event.end}T23:59:59Z`);
  if (now < start) {
    const days = dayDiff(start, now);
    return { label: "Upcoming", tone: "upcoming", detail: days === 1 ? "Starts tomorrow" : `Starts in ${days} days` };
  }
  if (now <= end) return { label: "Happening now", tone: "live", detail: "Event window is under way" };
  return { label: "Completed", tone: "past", detail: "Event has finished" };
}

export default function SportsCalendar({ events }: { events: SportsEvent[] }) {
  const [now, setNow] = useState<Date | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const sports = useMemo(() => ["All", ...Array.from(new Set(events.map((event) => event.sport)))], [events]);
  const visible = filter === "All" ? events : events.filter((event) => event.sport === filter);

  return (
    <section aria-labelledby="major-events-heading">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Major sports calendar</p>
          <h2 id="major-events-heading">World cups and major international events</h2>
        </div>
        <div className={styles.filters} aria-label="Filter events by sport">
          {sports.map((sport) => (
            <button key={sport} type="button" onClick={() => setFilter(sport)} className={filter === sport ? styles.activeFilter : ""}>
              {sport}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {visible.map((event) => {
          const status = getStatus(event, now);
          return (
            <article className={styles.card} key={event.name}>
              <div className={styles.cardTop}>
                <span className={`${styles.status} ${styles[status.tone] || ""}`}>{status.label}</span>
                <span className={styles.sport}>{event.sport}</span>
              </div>
              <h3>{event.name}</h3>
              <p className={styles.date}>{event.dateLabel}</p>
              <p className={styles.location}>{event.location}</p>
              {status.detail ? <p className={styles.countdown}>{status.detail}</p> : null}
              <p>{event.description}</p>
              <a className={styles.officialLink} href={event.officialUrl} target="_blank" rel="noreferrer noopener">
                {event.officialLabel} ↗
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
