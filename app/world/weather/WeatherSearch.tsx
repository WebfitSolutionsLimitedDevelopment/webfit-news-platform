"use client";

import { FormEvent, useState } from "react";
import styles from "./weather.module.css";

type WeatherData = {
  location: { name: string; country: string; state?: string | null };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windKph: number;
    description: string;
    icon: string;
    observedAt: string;
  };
  daily: Array<{
    date: string;
    min: number;
    max: number;
    rainChance: number;
    description: string;
    icon: string;
  }>;
  provider: string;
  fetchedAt: string;
};

export default function WeatherSearch() {
  const [query, setQuery] = useState("Auckland");
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/world/weather?q=${encodeURIComponent(query.trim())}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load weather.");
      setData(payload);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load weather.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.tool}>
      <form onSubmit={search} className={styles.searchForm}>
        <label htmlFor="weather-place" className={styles.label}>Search any city or place</label>
        <div className={styles.searchRow}>
          <input
            id="weather-place"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Auckland, London, Delhi, New York..."
            className={styles.input}
            autoComplete="off"
          />
          <button className={styles.button} disabled={loading} type="submit">
            {loading ? "Checking..." : "Check weather"}
          </button>
        </div>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {!data && !error && (
        <div className={styles.empty}>
          Search for a city to see current conditions, temperature, humidity, wind and a 5-day forecast.
        </div>
      )}

      {data && (
        <div className={styles.results}>
          <div className={styles.currentCard}>
            <div>
              <p className={styles.eyebrow}>Current weather</p>
              <h2>{data.location.name}{data.location.state ? `, ${data.location.state}` : ""}, {data.location.country}</h2>
              <p className={styles.description}>{data.current.description}</p>
            </div>
            <div className={styles.currentTemp}>{data.current.temperature}°C</div>
          </div>

          <div className={styles.metrics}>
            <div><span>Feels like</span><strong>{data.current.feelsLike}°C</strong></div>
            <div><span>Humidity</span><strong>{data.current.humidity}%</strong></div>
            <div><span>Wind</span><strong>{data.current.windKph} km/h</strong></div>
            <div><span>Observed</span><strong>{new Date(data.current.observedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong></div>
          </div>

          <h3 className={styles.forecastTitle}>5-day forecast</h3>
          <div className={styles.forecastGrid}>
            {data.daily.map((day) => (
              <article key={day.date} className={styles.forecastCard}>
                <strong>{new Date(`${day.date}T12:00:00`).toLocaleDateString([], { weekday: "short" })}</strong>
                <span>{new Date(`${day.date}T12:00:00`).toLocaleDateString([], { day: "numeric", month: "short" })}</span>
                <b>{day.max}° / {day.min}°</b>
                <span className={styles.capitalize}>{day.description}</span>
                <small>Rain chance {day.rainChance}%</small>
              </article>
            ))}
          </div>

          <p className={styles.freshness}>
            Updated {new Date(data.fetchedAt).toLocaleString()} · Source: {data.provider}. Weather data is for general information. For safety-critical decisions, check your official local meteorological authority.
          </p>
        </div>
      )}
    </section>
  );
}
