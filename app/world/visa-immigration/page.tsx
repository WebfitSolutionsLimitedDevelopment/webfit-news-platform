import Link from "next/link";
import styles from "./visa.module.css";

export const revalidate = 172800;

export const metadata = {
  title: "World Visa & Immigration | Official Government Links | Webfit News",
  description:
    "Find official visa and immigration portals for major destinations worldwide. Use government sources for visit, work, study and migration information.",
  alternates: { canonical: "/world/visa-immigration" },
  openGraph: {
    title: "World Visa & Immigration | Webfit News",
    description: "Official government visa and immigration portals for major destinations worldwide.",
    url: "/world/visa-immigration",
    type: "website",
  },
};

const destinations = [
  {country:"New Zealand", region:"Oceania", authority:"Immigration New Zealand", url:"https://www.immigration.govt.nz/", note:"Visit, work, study, residence and employer information."},
  {country:"Australia", region:"Oceania", authority:"Department of Home Affairs", url:"https://immi.homeaffairs.gov.au/", note:"Visa options, citizenship, skilled migration and travel permissions."},
  {country:"Canada", region:"North America", authority:"Immigration, Refugees and Citizenship Canada", url:"https://www.canada.ca/en/immigration-refugees-citizenship.html", note:"Visitor visas, work and study permits, permanent residence and citizenship."},
  {country:"United Kingdom", region:"Europe", authority:"UK Visas and Immigration", url:"https://www.gov.uk/browse/visas-immigration", note:"Visit, work, study, family, settlement and eVisa information."},
  {country:"United States", region:"North America", authority:"U.S. Department of State", url:"https://travel.state.gov/content/travel/en/us-visas.html", note:"Tourism, business, employment, study, exchange and immigrant visas."},
  {country:"India", region:"Asia", authority:"Government of India Visa Portal", url:"https://indianvisaonline.gov.in/", note:"Regular visas, eVisas and official arrival information."},
  {country:"Singapore", region:"Asia", authority:"Immigration & Checkpoints Authority", url:"https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements", note:"Entry visa requirements and official travel information."},
  {country:"Japan", region:"Asia", authority:"Ministry of Foreign Affairs of Japan", url:"https://www.mofa.go.jp/j_info/visit/visa/index.html", note:"Visa categories, exemptions and application guidance."},
  {country:"South Korea", region:"Asia", authority:"Korea Visa Portal", url:"https://www.visa.go.kr/", note:"Official visa navigator and application information."},
  {country:"United Arab Emirates", region:"Middle East", authority:"UAE Government", url:"https://u.ae/en/information-and-services/visa-and-emirates-id", note:"Entry visas, residence visas and Emirates ID guidance."},
  {country:"Germany", region:"Europe", authority:"Federal Foreign Office", url:"https://www.auswaertiges-amt.de/en/visa-service", note:"Visa requirements and official consular information."},
  {country:"France", region:"Europe", authority:"France-Visas", url:"https://france-visas.gouv.fr/en/", note:"Official French visa wizard, requirements and applications."},
  {country:"European Union / Schengen", region:"Europe", authority:"European Union", url:"https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en", note:"Official Schengen visa policy and border information."},
  {country:"Malaysia", region:"Asia", authority:"Immigration Department of Malaysia", url:"https://www.imi.gov.my/", note:"Official immigration, visa and entry information."},
  {country:"Indonesia", region:"Asia", authority:"Directorate General of Immigration", url:"https://evisa.imigrasi.go.id/", note:"Official electronic visa and stay permit services."},
];

export default function WorldVisaImmigrationPage() {
  const updated = new Intl.DateTimeFormat("en-NZ", { dateStyle: "long", timeZone: "Pacific/Auckland" }).format(new Date());

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><Link href="/world">World Guides</Link><span>/</span><span>Visa & Immigration</span>
      </nav>

      <header className={styles.hero}>
        <p className={styles.kicker}>WORLD VISA & IMMIGRATION</p>
        <h1>Start with the official immigration source</h1>
        <p>
          Visa rules can change quickly and depend on nationality, purpose of travel and personal circumstances. Webfit News therefore links directly to official government immigration portals instead of republishing stale eligibility rules.
        </p>
        <div className={styles.freshness}>Source directory refreshed every 48 hours • Page generated {updated}</div>
      </header>

      <section className={styles.notice}>
        <strong>Important:</strong> This is a navigation and information service, not immigration advice. Always confirm eligibility, fees, processing times and required documents on the destination government website before applying or booking travel.
      </section>

      <section className={styles.grid} aria-label="Official visa and immigration portals">
        {destinations.map((item) => (
          <article className={styles.card} key={item.country}>
            <div className={styles.region}>{item.region}</div>
            <h2>{item.country}</h2>
            <p className={styles.authority}>{item.authority}</p>
            <p>{item.note}</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.button}>
              Open official portal ↗
            </a>
          </article>
        ))}
      </section>

      <section className={styles.explainer}>
        <article><h2>Why we do not show a single “visa required” answer</h2><p>A correct answer can depend on passport, residence status, destination, transit route, purpose and duration. A generic global database can become wrong very quickly.</p></article>
        <article><h2>What to check before applying</h2><p>Check the official portal for visa type, eligibility, passport validity, funds, health or character requirements, fees, processing times and whether biometrics are required.</p></article>
        <article><h2>Freshness model</h2><p>This page revalidates on a 48-hour cycle. The actual rules remain with the government authority, so readers always have a direct path to the live source.</p></article>
      </section>

      <p style={{marginTop:28,fontWeight:700}}><Link href="/world">← Back to World Guides</Link></p>
    </main>
  );
}
