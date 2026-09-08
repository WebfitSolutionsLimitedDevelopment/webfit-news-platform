import Link from 'next/link';
import WorldClock from './WorldClock';
import styles from './time.module.css';

export const metadata = {
  title: 'World Time Now | Current Time in Cities Worldwide | Webfit News',
  description:
    'Check the current local time in major cities around the world, including Auckland, Delhi, London, New York, Sydney, Dubai, Tokyo and more.',
  alternates: { canonical: '/world/time' },
  openGraph: {
    title: 'World Time Now | Webfit News',
    description: 'Live local time across major cities and IANA time zones worldwide.',
    url: '/world/time',
    type: 'website',
  },
};

const faq = [
  {
    q: 'How accurate is the world clock?',
    a: 'The clocks use the device clock together with IANA time-zone rules available in the browser/runtime. They update every second.',
  },
  {
    q: 'Does this account for daylight saving time?',
    a: 'Yes. IANA time zones automatically apply daylight-saving and historical time-zone rules when supported by the runtime.',
  },
  {
    q: 'Does World Time need an external API?',
    a: 'No. The page uses standard time-zone data in the browser/runtime, so there is no API key, rate limit or external data dependency for the live clocks.',
  },
];

export default function WorldTimePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><Link href="/world">World Guides</Link><span>/</span><span>World Time</span>
      </nav>

      <header className={styles.hero}>
        <p className={styles.kicker}>WORLD TIME</p>
        <h1>Current time around the world</h1>
        <p>
          Check the live local time, date and time zone for major cities worldwide. Search by city or country and compare locations without relying on a third-party time API.
        </p>
      </header>

      <WorldClock />

      <section className={styles.infoGrid}>
        <article>
          <h2>Automatic daylight saving</h2>
          <p>IANA time-zone identifiers handle daylight-saving changes automatically where applicable, reducing the risk of stale manually maintained offsets.</p>
        </article>
        <article>
          <h2>No API dependency</h2>
          <p>The clocks are calculated locally using standard browser/runtime time-zone support. There is no external API key, request quota or provider outage dependency.</p>
        </article>
        <article>
          <h2>Useful for travel and calls</h2>
          <p>Use the page to compare business hours, international meetings, family calls and travel planning across common destinations.</p>
        </article>
      </section>

      <section className={styles.faq}>
        <h2>World time FAQs</h2>
        {faq.map((item) => <article key={item.q}><h3>{item.q}</h3><p>{item.a}</p></article>)}
      </section>

      <nav className={styles.related} aria-label="Related World Guides">
        <Link href="/world">← World Guides</Link>
        <Link href="/world/weather">World Weather</Link>
        <Link href="/world/currency-converter">Currency Converter</Link>
        <Link href="/world/gold-price">Gold Price Today</Link>
      </nav>
    </main>
  );
}
