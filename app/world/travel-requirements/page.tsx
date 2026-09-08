import Link from 'next/link';
import TravelRequirementsExplorer from './TravelRequirementsExplorer';
import styles from './travel.module.css';

export const revalidate = 172800;

export const metadata = {
  title: 'International Travel Requirements | Visa, Entry & Transit Rules | Webfit News',
  description:
    'Find official visa, entry, transit, passport and arrival-rule sources for major destinations worldwide, plus trusted government travel-advice links.',
  alternates: { canonical: '/world/travel-requirements' },
  openGraph: {
    title: 'International Travel Requirements | Webfit News',
    description: 'Official government sources for visa, entry, transit, passport and arrival requirements around the world.',
    url: '/world/travel-requirements',
    type: 'website',
  },
};

const checklist = [
  ['Passport validity', 'Check the destination rule and every transit-country rule. Do not assume the same validity period applies everywhere.'],
  ['Visa / ETA / e-Visa', 'Requirements depend on the passport you travel on, your purpose, duration, transit route and sometimes residence status.'],
  ['Transit permissions', 'A country can require a transit visa or travel authorisation even when you do not leave the airport.'],
  ['Arrival declarations', 'Some destinations require digital arrival, customs, health or traveller declarations before or on arrival.'],
  ['Onward travel & funds', 'Border authorities may ask for onward or return travel and evidence that you can support your stay.'],
  ['Health & medicines', 'Check vaccination, medication, prescription and health-entry rules with official health or border authorities.'],
  ['Customs & biosecurity', 'Food, plant, animal, medication, cash and duty-free rules vary significantly by destination.'],
  ['Travel advisory & insurance', 'Check current government travel advice because elevated advisory levels can affect insurance cover and assistance.'],
];

const trustedSources = [
  { name: 'New Zealand SafeTravel', href: 'https://www.safetravel.govt.nz/destinations', text: 'NZ Government destination advice, security levels and pre-departure guidance for New Zealand travellers.' },
  { name: 'Australian Smartraveller', href: 'https://www.smartraveller.gov.au/destinations', text: 'Australian Government destination advice covering safety, entry, local laws, health and practical travel information.' },
  { name: 'UK Foreign Travel Advice', href: 'https://www.gov.uk/foreign-travel-advice', text: 'UK Government advice for more than 200 countries and territories, including entry requirements and safety guidance.' },
  { name: 'U.S. State Department', href: 'https://travel.state.gov/content/travel/en/international-travel.html', text: 'Country information, passport and visa guidance, health information and security advice for international travel.' },
  { name: 'Government of Canada Travel', href: 'https://travel.gc.ca/travelling/advisories', text: 'Canadian Government travel advisories with entry and exit requirements, laws, health and safety information.' },
];

const faq = [
  { q: 'Can Webfit News tell me definitively whether I need a visa?', a: 'Not from destination alone. Visa and entry rules can depend on nationality, the passport used, residence status, transit points, travel purpose, length of stay and personal circumstances. Use the official immigration source linked for your destination.' },
  { q: 'Why does this page link to government sites instead of giving one universal answer?', a: 'Because immigration and border rules can change at short notice and commercial travel databases may have licensing restrictions. The destination government is the authority that sets and enforces entry rules.' },
  { q: 'Should I also check transit countries?', a: 'Yes. Transit permissions can be different from destination entry rules, and some travellers need a transit visa or electronic authorisation even when connecting airside.' },
  { q: 'How often is this guide reviewed?', a: 'This page is configured for a 48-hour freshness cycle, but users should still verify critical travel requirements immediately before booking and again before departure.' },
];

export default function TravelRequirementsPage() {
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) };
  const collectionLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'International Travel Requirements', url: 'https://webfitnews.com/world/travel-requirements', description: 'Official visa, entry, transit and travel requirement sources for international travellers.' };

  return (
    <main className={styles.main}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <p className={styles.breadcrumb}><Link href="/">Home</Link> / <Link href="/world">World Guides</Link> / International Travel Requirements</p>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>World Guides · Travel</p>
        <h1>International Travel Requirements</h1>
        <p>Check the official sources for visas, electronic travel authorisations, passport rules, transit permissions, arrival declarations and border requirements before you travel.</p>
        <div className={styles.warning}><strong>Important:</strong> entry rules are personal to your passport and itinerary. This page is a navigation and planning tool, not immigration or legal advice.</div>
      </header>
      <TravelRequirementsExplorer />
      <section className={styles.checklist} aria-labelledby="travel-checklist-heading">
        <div className={styles.sectionHead}><p className={styles.eyebrow}>Before you book</p><h2 id="travel-checklist-heading">International travel requirements checklist</h2><p>Use this list for your destination and for every country you transit through.</p></div>
        <div className={styles.checkGrid}>{checklist.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section className={styles.sources} aria-labelledby="trusted-travel-sources-heading">
        <div className={styles.sectionHead}><p className={styles.eyebrow}>Government travel advice</p><h2 id="trusted-travel-sources-heading">Trusted global travel-advice sources</h2><p>These government services provide country-level travel advice. Their advice is written primarily for their own citizens, so combine it with the destination country’s immigration authority.</p></div>
        <div className={styles.sourceGrid}>{trustedSources.map((source) => <a key={source.name} href={source.href} target="_blank" rel="noreferrer noopener"><strong>{source.name}</strong><span>{source.text}</span><b>Open official source ↗</b></a>)}</div>
      </section>
      <section className={styles.freshness}><h2>Why requirements can change quickly</h2><p>Governments can change visa exemptions, electronic authorisation systems, border procedures, health measures and passport rules with limited notice. Webfit News therefore points users to the authority that controls the rule instead of presenting a one-size-fits-all eligibility answer.</p><p><strong>Page freshness:</strong> configured for review/revalidation every 48 hours. Always re-check official sources close to departure.</p></section>
      <section className={styles.faq} aria-labelledby="travel-faq-heading"><h2 id="travel-faq-heading">Frequently asked questions</h2>{faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</section>
      <nav className={styles.related} aria-label="Related World Guides"><Link href="/world">← All World Guides</Link><Link href="/world/visa-immigration">Visa & Immigration</Link><Link href="/world/time">World Time</Link><Link href="/world/weather">World Weather</Link><Link href="/world/currency-converter">Currency Converter</Link></nav>
    </main>
  );
}
