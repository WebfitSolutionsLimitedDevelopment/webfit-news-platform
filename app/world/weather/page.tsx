import Link from "next/link";
import WeatherSearch from "./WeatherSearch";
import styles from "./weather.module.css";

export const metadata = {
  title: "World Weather Today | Live Weather & 5-Day Forecast | Webfit News",
  description:
    "Check live weather, temperature, humidity, wind and a 5-day forecast for cities around the world. Updated automatically from a live weather provider.",
  alternates: { canonical: "/world/weather" },
  openGraph: {
    title: "World Weather Today | Webfit News",
    description: "Live weather and 5-day forecasts for cities worldwide.",
    url: "/world/weather",
    type: "website",
  },
};

export default function WorldWeatherPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/world">World Guides</Link>
        <span>/</span>
        <span>Weather</span>
      </nav>

      <header className={styles.hero}>
        <p className={styles.kicker}>WORLD WEATHER</p>
        <h1>Weather anywhere in the world</h1>
        <p>
          Search a city or place for live conditions and a 5-day forecast. Data refreshes automatically so this page stays useful instead of turning into a static SEO page.
        </p>
      </header>

      <WeatherSearch />

      <section className={styles.infoGrid}>
        <article>
          <h2>How fresh is the data?</h2>
          <p>Current conditions are refreshed on a short cache cycle, while forecasts refresh every 30 minutes. Location lookups are cached longer because city coordinates rarely change.</p>
        </article>
        <article>
          <h2>Why the source matters</h2>
          <p>Webfit News uses a licensed weather API rather than scraping random websites. The provider is shown with the results, and the integration is isolated so another provider can be substituted later without rebuilding the page.</p>
        </article>
        <article>
          <h2>For severe weather</h2>
          <p>This tool is for general information. Warnings and safety decisions should always be checked against the relevant national meteorological or emergency-management authority.</p>
        </article>
      </section>

      <p style={{marginTop:28,fontWeight:700}}><Link href="/world">← Back to World Guides</Link></p>
    </main>
  );
}
