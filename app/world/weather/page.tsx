import Link from "next/link";
import WeatherSearch from "./WeatherSearch";
import styles from "./weather.module.css";

const SITE_URL = "https://webfitnews.com";
const PAGE_URL = `${SITE_URL}/world/weather`;

export const metadata = {
  title: "World Weather Today | Live Weather & 5-Day Forecast",
  description:
    "Check weather today for cities worldwide, including temperature, feels-like conditions, humidity, wind and a 5-day forecast with regularly refreshed data.",
  alternates: { canonical: "/world/weather" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "World Weather Today | Live Weather & 5-Day Forecast",
    description: "Check current weather and 5-day forecasts for cities around the world.",
    url: "/world/weather",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "World Weather Today | Live Weather & 5-Day Forecast",
    description: "Current weather, temperature, wind, humidity and 5-day forecasts for cities worldwide.",
  },
};

export default function WorldWeatherPage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "World Weather Today",
      url: PAGE_URL,
      description: "Current weather conditions and 5-day forecasts for cities worldwide.",
      isPartOf: { "@type": "WebSite", name: "Webfit News", url: SITE_URL },
      about: [
        { "@type": "Thing", name: "Weather" },
        { "@type": "Thing", name: "Weather forecast" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "World Guides", item: `${SITE_URL}/world` },
        { "@type": "ListItem", position: 3, name: "World Weather", item: PAGE_URL },
      ],
    },
  ];

  return (
    <main className={styles.page}>
      {structuredData.map((data, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />)}

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/world">World Guides</Link>
        <span>/</span>
        <span>Weather</span>
      </nav>

      <header className={styles.hero}>
        <p className={styles.kicker}>WORLD WEATHER</p>
        <h1>World weather today and 5-day forecast</h1>
        <p>
          Search any city or place to check current temperature, feels-like conditions, humidity, wind and the next five days of weather. Forecast data refreshes automatically throughout the day.
        </p>
      </header>

      <WeatherSearch />

      <section className={styles.infoGrid}>
        <article>
          <h2>How often is the weather updated?</h2>
          <p>Current conditions use a short refresh cycle, while forecasts refresh every 30 minutes. Location lookups are cached longer because city coordinates rarely change.</p>
        </article>
        <article>
          <h2>What weather information is shown?</h2>
          <p>The tool shows current temperature, feels-like temperature, humidity, wind and a five-day forecast for the location you search.</p>
        </article>
        <article>
          <h2>For severe weather and official warnings</h2>
          <p>This tool is for general information. For warnings, evacuations or safety decisions, check the relevant national meteorological or emergency-management authority.</p>
        </article>
      </section>

      <section className={styles.infoGrid} aria-label="Related weather and travel guides">
        <article><h2>Planning around local dates?</h2><p><Link href="/world/public-holidays">Check public holidays by country</Link> before booking travel, appointments or business activity.</p></article>
        <article><h2>Travelling internationally?</h2><p><Link href="/world/travel-requirements">Check official travel and entry requirement sources</Link> for your destination and transit points.</p></article>
        <article><h2>Need local time?</h2><p><Link href="/world/time">Check current world time</Link> across major cities and time zones.</p></article>
      </section>

      <p style={{marginTop:28,fontWeight:700}}><Link href="/world">← Back to World Guides</Link></p>
    </main>
  );
}
