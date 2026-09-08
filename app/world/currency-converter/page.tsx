import Link from "next/link";
import CurrencyConverter from "./CurrencyConverter";
import styles from "./currency.module.css";

export const metadata = {
  title: "World Currency Converter | Latest Exchange Rates | Webfit News",
  description:
    "Convert NZD, INR, USD, GBP, AUD, EUR and other major currencies using regularly refreshed ECB reference exchange rates.",
  alternates: { canonical: "/world/currency-converter" },
  openGraph: {
    title: "World Currency Converter | Webfit News",
    description: "Convert major world currencies using regularly refreshed ECB reference rates.",
    url: "/world/currency-converter",
    type: "website",
  },
};

export default function WorldCurrencyConverterPage(){
  const faq=[
    {q:"How often are exchange rates updated?",a:"The converter checks for updated reference rates hourly. ECB reference rates are normally published on working days, so weekends and holidays may show the latest previous working-day rate."},
    {q:"Are these bank or card rates?",a:"No. These are reference rates for information. Banks, card providers and money-transfer services usually apply their own rates, fees and margins."},
    {q:"What source does Webfit News use?",a:"The converter uses European Central Bank reference statistics delivered through the Frankfurter API, with the source shown alongside the result."},
  ];
  const jsonLd={"@context":"https://schema.org","@type":"FAQPage",mainEntity:faq.map(item=>({"@type":"Question",name:item.q,acceptedAnswer:{"@type":"Answer",text:item.a}}))};

  return <main className={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}} />
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/world">World Guides</Link><span>/</span><span>Currency Converter</span></nav>

    <header className={styles.hero}>
      <p className={styles.kicker}>WORLD CURRENCY CONVERTER</p>
      <h1>Convert major world currencies</h1>
      <p>Check an indicative conversion using regularly refreshed central-bank reference rates. Choose the amount and currencies, then swap them instantly.</p>
    </header>

    <CurrencyConverter />

    <section className={styles.infoGrid}>
      {faq.map(item=><article key={item.q}><h2>{item.q}</h2><p>{item.a}</p></article>)}
    </section>

    <section className={styles.related}>
      <h2>Explore more World Guides</h2>
      <div className={styles.relatedLinks}>
        <Link href="/world/weather">World Weather</Link>
        <Link href="/world/public-holidays">World Public Holidays</Link>
        <Link href="/world/visa-immigration">World Visa & Immigration</Link>
        <Link href="/world">All World Guides</Link>
      </div>
    </section>
  </main>;
}
