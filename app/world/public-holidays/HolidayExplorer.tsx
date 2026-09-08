"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./holidays.module.css";

type Holiday = {
  date: string;
  name: string;
  countryCode: string;
  subdivisionCodes: string[] | null;
  nationalHoliday: boolean;
  holidayTypes: string[];
};

type Payload = {
  countryCode: string;
  year: number;
  holidays: Holiday[];
  lastUpdated: string;
  refreshHours: number;
  provider: string;
  providerUrl: string;
};

function localToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function countryOptions() {
  const display = new Intl.DisplayNames(["en"], { type: "region" });
  const countries: { code: string; name: string }[] = [];
  for (let a = 65; a <= 90; a += 1) {
    for (let b = 65; b <= 90; b += 1) {
      const code = String.fromCharCode(a, b);
      const name = display.of(code);
      if (name && name !== code) countries.push({ code, name });
    }
  }
  return countries.sort((x, y) => x.name.localeCompare(y.name));
}

export default function HolidayExplorer() {
  const currentYear = new Date().getFullYear();
  const [country, setCountry] = useState("NZ");
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const countries = useMemo(countryOptions, []);
  const countryName = useMemo(() => new Intl.DisplayNames(["en"], { type: "region" }).of(country) || country, [country]);
  const today = localToday();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/world/holidays?country=${country}&year=${year}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load holidays.");
        return body as Payload;
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message || "Unable to load holidays.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [country, year]);

  const nextHoliday = data?.holidays.find((holiday) => holiday.date >= today);

  return (
    <section className={styles.explorer}>
      <div className={styles.controls}>
        <label>
          Country
          <select value={country} onChange={(event) => setCountry(event.target.value)}>
            {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </label>
        <label>
          Year
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      {loading && <div className={styles.state}>Loading public holidays…</div>}
      {error && <div className={`${styles.state} ${styles.error}`}>{error}</div>}

      {!loading && !error && data && (
        <>
          <div className={styles.summary}>
            <div>
              <span className={styles.eyebrow}>SELECTED COUNTRY</span>
              <strong>{countryName}</strong>
            </div>
            <div>
              <span className={styles.eyebrow}>PUBLIC HOLIDAYS</span>
              <strong>{data.holidays.length}</strong>
            </div>
            <div>
              <span className={styles.eyebrow}>NEXT HOLIDAY</span>
              <strong>{nextHoliday ? nextHoliday.name : "None remaining"}</strong>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>Date</th><th>Holiday</th><th>Coverage</th><th>Status</th></tr></thead>
              <tbody>
                {data.holidays.map((holiday) => {
                  const status = holiday.date < today ? "Passed" : holiday.date === today ? "Today" : "Upcoming";
                  return (
                    <tr key={`${holiday.date}-${holiday.name}`} className={status === "Passed" ? styles.passed : status === "Today" ? styles.today : undefined}>
                      <td>{new Date(`${holiday.date}T00:00:00`).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric", weekday: "short" })}</td>
                      <td><strong>{holiday.name}</strong></td>
                      <td>{holiday.nationalHoliday ? "National" : holiday.subdivisionCodes?.join(", ") || "Regional"}</td>
                      <td><span className={`${styles.badge} ${styles[status.toLowerCase()]}`}>{status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.sourceLine}>
            Source: <a href={data.providerUrl} target="_blank" rel="noreferrer">{data.provider}</a>. Data refreshes every {data.refreshHours} hours. Last fetched {new Date(data.lastUpdated).toLocaleString()}.
          </div>
        </>
      )}
    </section>
  );
}
