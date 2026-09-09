import Link from "next/link";
import HolidayExplorer from "./HolidayExplorer";
import styles from "./holidays.module.css";

const SITE_URL = "https://webfitnews.com";
const PAGE_URL = `${SITE_URL}/world/public-holidays`;

export const metadata = {
  title: "World Public Holidays 2026 | Country Holiday Calendar",
  description:
    "Check 2026 public holidays by country, including upcoming, today and passed status, national and regional coverage, and year selection with regularly refreshed data.",
  alternates: { canonical: "/world/public-holidays" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "World Public Holidays 2026 | Country Holiday Calendar",
    description: "Check country-by-country public holiday dates with upcoming, today and passed status.",
    url: "/world/public-holidays",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "World Public Holidays 2026 | Country Holiday Calendar",
    description: "Public holiday dates by country, including national and regional holidays.",
  },
};

export default function WorldPublicHolidaysPage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "World Public Holidays 2026",
      url: PAGE_URL,
      description: "Country-by-country public holiday calendar with national and regional holiday dates.",
      isPartOf: { "@type": "WebSite", name: "Webfit News", url: SITE_URL },
      about: [
        { "@type": "Thing", name: "Public holidays" },
        { "@type": "Thing", name: "Holiday calendar" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "World Guides", item: `${SITE_URL}/world` },
        { "@type": "ListItem", position: 3, name: "World Public Holidays", item: PAGE_URL },
      ],
    },
  ];

  return (
    <main className={styles.page}>
      {structuredData.map((data, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />)}

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><Link href="/world">World Guides</Link><span>/</span><span>Public Holidays</span>
      </nav>

      <header className={styles.hero}>
        <p className={styles.kicker}>WORLD PUBLIC HOLIDAYS</p>
        <h1>World public holidays 2026 by country</h1>
        <p>Select a country and year to check public holiday dates, including clear passed, today and upcoming status. Where available, the calendar also identifies regional holidays.</p>
      </header>

      <HolidayExplorer />

      <section className={styles.infoGrid}>
        <article><h2>How often are holiday dates updated?</h2><p>Holiday data is revalidated every six hours. The year selector rolls forward automatically, so future calendars remain accessible without rebuilding the page.</p></article>
        <article><h2>National and regional public holidays</h2><p>Some countries have holidays that apply only to states, provinces or other first-level subdivisions. Where the data provider supplies those subdivision codes, they are shown with the holiday.</p></article>
        <article><h2>Confirm important holiday dates</h2><p>Holiday rules can change by legislation or government announcement. For payroll, legal deadlines, travel or business closures, confirm critical dates with the relevant government authority.</p></article>
      </section>

      <section className={styles.infoGrid} aria-label="Related holiday and travel guides">
        <article><h2>Checking a trip?</h2><p><Link href="/world/travel-requirements">Review official travel and entry requirement sources</Link> for your destination and transit points.</p></article>
        <article><h2>Need the local forecast?</h2><p><Link href="/world/weather">Check current world weather and a 5-day forecast</Link> for your destination.</p></article>
        <article><h2>Coordinating across time zones?</h2><p><Link href="/world/time">Check current world time</Link> before calling businesses, agencies or family overseas.</p></article>
      </section>

      <p style={{marginTop:28,fontWeight:700}}><Link href="/world">← Back to World Guides</Link></p>
    </main>
  );
}
