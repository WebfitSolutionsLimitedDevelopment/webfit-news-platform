import Link from "next/link";
import HolidayExplorer from "./HolidayExplorer";
import styles from "./holidays.module.css";

export const metadata = {
  title: "World Public Holidays 2026 | Country Holiday Calendar | Webfit News",
  description:
    "Check public holidays by country with automatic updates, upcoming and passed status, and year selection. Powered by a current global holiday data source.",
  alternates: { canonical: "/world/public-holidays" },
  openGraph: {
    title: "World Public Holidays | Webfit News",
    description: "Country-by-country public holiday calendars with upcoming and passed status.",
    url: "/world/public-holidays",
    type: "website",
  },
};

export default function WorldPublicHolidaysPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><Link href="/world">World Guides</Link><span>/</span><span>Public Holidays</span>
      </nav>

      <header className={styles.hero}>
        <p className={styles.kicker}>WORLD PUBLIC HOLIDAYS</p>
        <h1>Public holidays around the world</h1>
        <p>Select a country and year to see public holidays with clear passed, today and upcoming status. The calendar refreshes automatically from a global holiday API.</p>
      </header>

      <HolidayExplorer />

      <section className={styles.infoGrid}>
        <article><h2>How often is this updated?</h2><p>Holiday data is revalidated every six hours. The selected year rolls forward automatically, so this page does not depend on an annual manual rebuild.</p></article>
        <article><h2>National and regional holidays</h2><p>Some countries have holidays that apply only to states, provinces or other first-level subdivisions. Where the provider supplies those codes, they are shown in the table.</p></article>
        <article><h2>Check critical dates</h2><p>Holiday rules can change by legislation or government announcement. For payroll, legal deadlines, travel or business closures, confirm the date with the relevant government authority.</p></article>
      </section>

      <p style={{marginTop:28,fontWeight:700}}><Link href="/world">← Back to World Guides</Link></p>
    </main>
  );
}
