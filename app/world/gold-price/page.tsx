import Link from 'next/link';
import GoldPriceClient from './GoldPriceClient';
import styles from './gold.module.css';

export const metadata = {
  title: 'Gold Price Today | Live Gold Price Per Ounce & Gram | Webfit News',
  description:
    'Check the latest gold spot price today in NZD, INR, USD, AUD, GBP, EUR and other major currencies, including 24K, 22K, 18K and 14K gold per gram.',
  alternates: { canonical: '/world/gold-price' },
  openGraph: {
    title: 'Gold Price Today | Webfit News',
    description: 'Latest gold spot price per ounce and per gram with major currency conversion.',
    url: '/world/gold-price',
    type: 'website',
  },
};

export default function WorldGoldPricePage() {
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the gold price shown on this page?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The page shows a reference spot price for gold per troy ounce and calculated reference prices per gram. Retail jewellery and bullion prices may include dealer premiums, taxes, fabrication charges and other costs.',
        },
      },
      {
        '@type': 'Question',
        name: 'How often is the gold price updated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The gold spot feed is revalidated every five minutes. Currency conversion rates are checked hourly using ECB reference rates through Frankfurter where a non-USD display currency is selected.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are 22K and 18K gold prices calculated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'They are purity-based reference calculations from the 24K spot value. Actual retail prices can differ because of making charges, dealer margins, taxes, spreads and local market conditions.',
        },
      },
    ],
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><Link href="/world">World Guides</Link><span>/</span><span>Gold Price Today</span>
      </nav>

      <header className={styles.hero}>
        <p className={styles.kicker}>GOLD PRICE TODAY</p>
        <h1>Gold price today</h1>
        <p>
          Check the latest reference gold spot price per troy ounce and per gram. Switch between NZD, INR, USD, AUD, GBP, EUR and other major currencies, with purity-based 24K, 22K, 18K and 14K reference values.
        </p>
        <Link className={styles.guideLink} href="/world">← Back to World Guides</Link>
      </header>

      <GoldPriceClient />

      <section className={styles.infoGrid}>
        <article>
          <h2>What does “spot price” mean?</h2>
          <p>The spot price is a market reference for gold before retail premiums, taxes, dealer spreads, fabrication charges or jewellery-making costs are added.</p>
        </article>
        <article>
          <h2>Why can shop prices be different?</h2>
          <p>Physical gold products and jewellery are sold above or below the raw reference value depending on purity, product type, local taxes, dealer margin, demand and supply.</p>
        </article>
        <article>
          <h2>How fresh is this page?</h2>
          <p>The gold feed is revalidated every five minutes. Non-USD currency conversion uses ECB reference rates through Frankfurter and is checked hourly.</p>
        </article>
      </section>

      <section className={styles.related}>
        <h2>Explore more World Guides</h2>
        <div className={styles.relatedLinks}>
          <Link href="/world/currency-converter">Currency Converter</Link>
          <Link href="/world/weather">World Weather</Link>
          <Link href="/world/public-holidays">Public Holidays</Link>
          <Link href="/world/visa-immigration">Visa & Immigration</Link>
        </div>
      </section>

      <section className={styles.related}>
        <h2>Important note</h2>
        <p>This page is for general information only and is not investment, trading or financial advice. Verify prices with your bullion dealer, jeweller, bank or trading venue before making a transaction.</p>
      </section>
    </main>
  );
}
