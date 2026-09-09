import Link from 'next/link';
import GoldPriceClient from './GoldPriceClient';
import styles from './gold.module.css';

const SITE_URL = 'https://webfitnews.com';
const PAGE_URL = `${SITE_URL}/world/gold-price`;

export const metadata = {
  title: 'Gold Price Today | 24K, 22K & 18K Price Per Gram & Ounce',
  description:
    'Check the latest gold price today per troy ounce and gram in NZD, INR, USD, AUD, GBP and EUR, including 24K, 22K, 18K and 14K reference prices.',
  alternates: { canonical: '/world/gold-price' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Gold Price Today | Price Per Gram & Ounce',
    description: 'Latest gold spot price per ounce and gram with 24K, 22K, 18K and 14K reference values in major currencies.',
    url: '/world/gold-price',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gold Price Today | Price Per Gram & Ounce',
    description: 'Check gold price today in NZD, INR, USD, AUD, GBP, EUR and other major currencies.',
  },
};

export default function WorldGoldPricePage() {
  const faqItems = [
    {
      q: 'What is the gold price shown on this page?',
      a: 'The page shows a reference spot price for gold per troy ounce and calculated reference prices per gram. Retail jewellery and bullion prices may include dealer premiums, taxes, fabrication charges and other costs.',
    },
    {
      q: 'How often is the gold price updated?',
      a: 'The gold spot feed is revalidated every five minutes. Currency conversion rates are checked hourly using ECB reference rates through Frankfurter where a non-USD display currency is selected.',
    },
    {
      q: 'How are 22K and 18K gold prices calculated?',
      a: 'They are purity-based reference calculations from the 24K spot value. Actual retail prices can differ because of making charges, dealer margins, taxes, spreads and local market conditions.',
    },
  ];

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Gold Price Today',
      url: PAGE_URL,
      description: 'Current reference gold spot price per ounce and gram in major currencies.',
      isPartOf: { '@type': 'WebSite', name: 'Webfit News', url: SITE_URL },
      about: [
        { '@type': 'Thing', name: 'Gold price' },
        { '@type': 'Thing', name: 'Gold spot price' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'World Guides', item: `${SITE_URL}/world` },
        { '@type': 'ListItem', position: 3, name: 'Gold Price Today', item: PAGE_URL },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];

  return (
    <main className={styles.page}>
      {structuredData.map((data, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />)}

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><Link href="/world">World Guides</Link><span>/</span><span>Gold Price Today</span>
      </nav>

      <header className={styles.hero}>
        <p className={styles.kicker}>GOLD PRICE TODAY</p>
        <h1>Gold price today per gram and ounce</h1>
        <p>
          Check the latest reference gold spot price per troy ounce and per gram. Switch between NZD, INR, USD, AUD, GBP, EUR and other major currencies, with 24K, 22K, 18K and 14K purity-based values.
        </p>
        <Link className={styles.guideLink} href="/world">← Back to World Guides</Link>
      </header>

      <GoldPriceClient />

      <section className={styles.infoGrid}>
        <article>
          <h2>Gold price per gram vs per ounce</h2>
          <p>International gold markets commonly quote a troy-ounce spot price. This page also converts that reference into per-gram values so 24K, 22K, 18K and 14K gold are easier to compare.</p>
        </article>
        <article>
          <h2>Why jewellery and bullion prices differ</h2>
          <p>Physical gold products and jewellery can cost more or less than the raw reference value depending on purity, product type, taxes, dealer margin, fabrication charges, local demand and supply.</p>
        </article>
        <article>
          <h2>How fresh is the gold price?</h2>
          <p>The gold feed is revalidated every five minutes. Non-USD currency conversion uses ECB reference rates through Frankfurter and is checked hourly.</p>
        </article>
      </section>

      <section className={styles.related}>
        <h2>Related market and travel tools</h2>
        <div className={styles.relatedLinks}>
          <Link href="/world/currency-converter">Currency Converter</Link>
          <Link href="/world/time">World Time</Link>
          <Link href="/world/weather">World Weather</Link>
          <Link href="/world/news">World News</Link>
        </div>
      </section>

      <section className={styles.related}>
        <h2>Important note</h2>
        <p>This page is for general information only and is not investment, trading or financial advice. Verify transaction prices with your bullion dealer, jeweller, bank or trading venue.</p>
      </section>
    </main>
  );
}
