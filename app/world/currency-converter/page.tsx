import Link from "next/link";
import CurrencyConverter from "./CurrencyConverter";
import styles from "./currency.module.css";

const SITE_URL = "https://webfitnews.com";
const PAGE_URL = `${SITE_URL}/world/currency-converter`;

export const metadata = {
  title: "Currency Converter | NZD, INR, USD, GBP, AUD & EUR Rates",
  description:
    "Convert NZD, INR, USD, GBP, AUD, EUR and other major currencies using regularly refreshed ECB reference exchange rates. Check indicative rates and popular currency pairs.",
  alternates: { canonical: "/world/currency-converter" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Currency Converter | Major World Exchange Rates",
    description: "Convert major currencies using regularly refreshed ECB reference exchange rates.",
    url: "/world/currency-converter",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Currency Converter | Major World Exchange Rates",
    description: "Convert NZD, INR, USD, GBP, AUD, EUR and other major currencies.",
  },
};

export default function WorldCurrencyConverterPage(){
  const faq=[
    {q:"How often are exchange rates updated?",a:"The converter checks for updated reference rates hourly. ECB reference rates are normally published on working days, so weekends and holidays may show the latest previous working-day rate."},
    {q:"Are these bank or card rates?",a:"No. These are reference rates for information. Banks, card providers and money-transfer services usually apply their own rates, fees and margins."},
    {q:"What source does Webfit News use?",a:"The converter uses European Central Bank reference statistics delivered through the Frankfurter API, with the source shown alongside the result."},
  ];

  const structuredData = [
    {
      "@context":"https://schema.org",
      "@type":"WebPage",
      name:"Currency Converter",
      url:PAGE_URL,
      description:"Currency converter for major world currencies using regularly refreshed ECB reference exchange rates.",
      isPartOf:{"@type":"WebSite",name:"Webfit News",url:SITE_URL},
      about:[
        {"@type":"Thing",name:"Foreign exchange"},
        {"@type":"Thing",name:"Currency conversion"},
      ],
    },
    {
      "@context":"https://schema.org",
      "@type":"BreadcrumbList",
      itemListElement:[
        {"@type":"ListItem",position:1,name:"Home",item:`${SITE_URL}/`},
        {"@type":"ListItem",position:2,name:"World Guides",item:`${SITE_URL}/world`},
        {"@type":"ListItem",position:3,name:"Currency Converter",item:PAGE_URL},
      ],
    },
    {"@context":"https://schema.org","@type":"FAQPage",mainEntity:faq.map(item=>({"@type":"Question",name:item.q,acceptedAnswer:{"@type":"Answer",text:item.a}}))},
  ];

  return <main className={styles.page}>
    {structuredData.map((data,index)=><script key={index} type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data)}} />)}
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/world">World Guides</Link><span>/</span><span>Currency Converter</span></nav>

    <header className={styles.hero}>
      <p className={styles.kicker}>WORLD CURRENCY CONVERTER</p>
      <h1>Currency converter for major world currencies</h1>
      <p>Convert amounts between NZD, INR, USD, GBP, AUD, EUR and other major currencies using regularly refreshed central-bank reference rates.</p>
    </header>

    <CurrencyConverter />

    <section className={styles.infoGrid}>
      {faq.map(item=><article key={item.q}><h2>{item.q}</h2><p>{item.a}</p></article>)}
    </section>

    <section className={styles.infoGrid} aria-label="Popular currency conversion help">
      <article><h2>Popular currency pairs</h2><p>Use the converter for common searches such as NZD to INR, NZD to USD, USD to INR, GBP to NZD, AUD to NZD and EUR to USD.</p></article>
      <article><h2>Reference rate vs transfer rate</h2><p>The displayed result is an indicative reference conversion. Your bank, card issuer or transfer provider may apply a different exchange rate plus fees or margins.</p></article>
      <article><h2>Travelling overseas?</h2><p><Link href="/world/travel-requirements">Check international travel requirements</Link> and <Link href="/world/time">world time</Link> alongside your currency planning.</p></article>
    </section>

    <section className={styles.related}>
      <h2>Explore more World Guides</h2>
      <div className={styles.relatedLinks}>
        <Link href="/world/gold-price">Gold Price Today</Link>
        <Link href="/world/weather">World Weather</Link>
        <Link href="/world/public-holidays">World Public Holidays</Link>
        <Link href="/world/travel-requirements">Travel Requirements</Link>
        <Link href="/world">All World Guides</Link>
      </div>
    </section>
  </main>;
}
