import Link from 'next/link';
import { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { visaDefinitions, VisaCategory } from '@/lib/immigration';
import styles from './Immigration.module.css';

const SITE_URL = 'https://webfitnews.com';
const PAGE_URL = `${SITE_URL}/immigration`;

export const metadata: Metadata = {
  title: 'NZ Visa Guide 2026 | New Zealand Immigration & Visa Information',
  description: 'Browse current New Zealand visa information for work, study, visitor, family and residence pathways. Compare NZ visas, read requirements and download branded checklists linked to official Immigration New Zealand sources.',
  alternates: { canonical: '/immigration' },
  openGraph: {
    title: 'NZ Visa Guide 2026 | New Zealand Immigration Information',
    description: 'Current New Zealand visa information organised by work, study, visitor, family and residence pathways with official INZ sources and downloadable checklists.',
    url: '/immigration',
    siteName: 'Webfit News',
    type: 'website',
    locale: 'en_NZ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NZ Visa Guide 2026 | New Zealand Immigration Information',
    description: 'Browse current NZ visa information, requirements, source links and downloadable checklists.',
  },
};

const categories: Array<{name: VisaCategory; id: string; route: string; description: string}> = [
  {name: 'Work', id: 'work-visas', route: '/immigration/work-visas', description: 'New Zealand work visas for employment, post-study work, seasonal work and other approved work purposes.'},
  {name: 'Study', id: 'study-visas', route: '/immigration/student-visas', description: 'New Zealand student visas for international study, scholarships, exchange programmes and approved study pathways.'},
  {name: 'Visit', id: 'visit-visas', route: '/immigration/visitor-visas', description: 'New Zealand visitor visas for holidays, family visits, medical treatment, transit and other temporary stays.'},
  {name: 'Residence', id: 'residence-visas', route: '/immigration/residence-visas', description: 'New Zealand residence pathways for skilled workers, investors, entrepreneurs and qualifying humanitarian categories.'},
  {name: 'Family', id: 'family-visas', route: '/immigration/family-visas', description: 'New Zealand partner, parent, child and other family visa pathways.'},
];

const popularSlugs = [
  'accredited-employer-work-visa',
  'fee-paying-student-visa',
  'visitor-visa',
  'post-study-work-visa',
  'partner-of-a-new-zealander-work-visa',
  'partner-of-a-new-zealander-resident-visa',
  'skilled-migrant-category-resident-visa',
  'straight-to-residence-visa',
  'work-to-residence-visa',
  'parent-resident-visa',
];

const popularVisas = popularSlugs
  .map((slug) => visaDefinitions.find((visa) => visa.slug === slug))
  .filter((visa): visa is NonNullable<typeof visa> => Boolean(visa));

export default function ImmigrationHubPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'New Zealand Visa Guide',
    description: 'Current New Zealand visa and immigration information organised by Webfit News from official Immigration New Zealand sources.',
    url: PAGE_URL,
    isPartOf: { '@type': 'WebSite', name: 'Webfit News', url: SITE_URL },
    about: { '@type': 'Thing', name: 'New Zealand visas and immigration' },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: visaDefinitions.length,
      itemListElement: visaDefinitions.map((visa, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: visa.name,
        url: `${PAGE_URL}/${visa.slug}`,
      })),
    },
  };

  return <>
    <SiteHeader/>
    <main id="top" className={`shell ${styles.page}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}/>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>Webfit News NZ Immigration Information</span>
        <h1>New Zealand Visa Guide</h1>
        <p className={styles.heroLead}>
          Looking for current NZ visa or New Zealand immigration information? Browse visa pathways by work, study, visit, residence and family, open a detailed guide, check the official Immigration New Zealand source and download a current Webfit News checklist.
        </p>
        <div className={styles.notice}>
          <strong>General information only.</strong> Webfit News does not provide immigration advice or assess personal eligibility. Visa rules can change, so always confirm the current requirements on the official Immigration New Zealand website before applying.
        </div>
      </section>

      <nav className={styles.jumpNav} aria-label="New Zealand visa guide sections">
        <span>Jump to:</span>
        {categories.map(category => <a key={category.id} href={`#${category.id}`}>{category.name} visas</a>)}
        <Link href="/category/immigration">NZ Immigration News</Link>
      </nav>

      <section className={styles.introGrid} aria-label="How to use the New Zealand visa guide">
        <div>
          <strong>1. Choose your NZ visa category</strong>
          <p>Start with work, study, visit, residence or family.</p>
        </div>
        <div>
          <strong>2. Read the latest visa guide</strong>
          <p>Each guide organises information from the relevant official Immigration New Zealand source.</p>
        </div>
        <div>
          <strong>3. Download the visa checklist</strong>
          <p>Every listed visa has a branded PDF checklist generated from the latest source snapshot used by the guide.</p>
        </div>
      </section>

      <section className={styles.sourcePanel} aria-labelledby="visa-category-guides">
        <span className={styles.sectionLabel}>In-depth NZ visa category guides</span>
        <h2 id="visa-category-guides">Browse New Zealand visas by search intent</h2>
        <p>Use these dedicated category pages when you want to compare one type of New Zealand visa in more depth, then open the individual visa that matches the purpose you are researching.</p>
        <div className={styles.questions}>
          {categories.map((category) => <Link key={category.route} className={styles.question} href={category.route}>{category.name === 'Study' ? 'New Zealand student visas' : `New Zealand ${category.name.toLowerCase()} visas`}</Link>)}
        </div>
      </section>

      <section className={styles.sourcePanel} aria-labelledby="popular-nz-visas">
        <span className={styles.sectionLabel}>Popular New Zealand visa searches</span>
        <h2 id="popular-nz-visas">Popular NZ visa guides</h2>
        <p>Quick links to some of the New Zealand visa pathways people commonly look for. Use the full tables below to browse every visa currently covered by Webfit News.</p>
        <div className={styles.questions}>
          {popularVisas.map((visa) => <Link key={visa.slug} className={styles.question} href={`/immigration/${visa.slug}`}>{visa.name}</Link>)}
        </div>
      </section>

      {categories.map((category) => {
        const visas = visaDefinitions.filter((visa) => visa.category === category.name);
        if (!visas.length) return null;

        return <section key={category.id} id={category.id} className={styles.category}>
          <div className={styles.categoryHeading}>
            <div>
              <span className={styles.sectionLabel}>{category.name}</span>
              <h2>New Zealand {category.name === 'Study' ? 'student' : category.name.toLowerCase()} visas</h2>
              <p>{category.description}</p>
              <p><Link className={styles.openGuide} href={category.route}>Explore the full {category.name === 'Study' ? 'NZ student visa' : `NZ ${category.name.toLowerCase()} visa`} category guide →</Link></p>
            </div>
            <a className={styles.backTop} href="#top">Back to top ↑</a>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.visaTable}>
              <thead>
                <tr>
                  <th>New Zealand visa</th>
                  <th>What it is generally for</th>
                  <th>Category</th>
                  <th>Visa guide</th>
                  <th>Checklist</th>
                </tr>
              </thead>
              <tbody>
                {visas.map((visa) => <tr key={visa.slug}>
                  <td data-label="Visa">
                    <Link className={styles.visaName} href={`/immigration/${visa.slug}`}>{visa.name}</Link>
                  </td>
                  <td data-label="What it is generally for">
                    <Link className={styles.summaryLink} href={`/immigration/${visa.slug}`}>{visa.summary}</Link>
                  </td>
                  <td data-label="Category"><span className={styles.categoryPill}>{visa.category}</span></td>
                  <td data-label="Guide">
                    <Link className={styles.openGuide} href={`/immigration/${visa.slug}`}>Read {visa.name} guide →</Link>
                  </td>
                  <td data-label="Checklist">
                    <a className={styles.downloadGuide} href={`/immigration/${visa.slug}/checklist.pdf`}>
                      Download PDF ↓
                    </a>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </section>;
      })}

      <section className={styles.checklistPanel}>
        <div>
          <span className={styles.sectionLabel}>NZ visa checklists</span>
          <h2>Download a current checklist for every visa guide</h2>
          <p>Each PDF carries Webfit News branding, the official source link, the source-check time, key visa facts, extracted requirements, document information and the general-information disclaimer. Download it again whenever you need a fresh copy.</p>
        </div>
        <strong>Always verify the final requirements with Immigration New Zealand before applying.</strong>
      </section>

      <section className={styles.newsPanel}>
        <div>
          <span className={styles.sectionLabel}>NZ immigration updates</span>
          <h2>New Zealand immigration news and visa changes</h2>
          <p>Read Webfit News coverage of Immigration New Zealand announcements, work rights, policy changes, visa settings and other New Zealand immigration developments.</p>
        </div>
        <Link className={styles.newsLink} href="/category/immigration">Read NZ Immigration News →</Link>
      </section>

      <section className={styles.sourcePanel}>
        <h2>About the Webfit News New Zealand Visa Guide</h2>
        <p>
          Webfit News reorganises publicly available Immigration New Zealand information into a simpler reference format. Detailed visa guides include direct links to the relevant official pages and show when the source information was last checked.
        </p>
        <p>
          You can also use the Webfit News language selector and listen-aloud accessibility features while reading these New Zealand visa guides.
        </p>
      </section>

      <div className={styles.disclaimer}>
        <strong>Information notice:</strong> This section is provided for general informational convenience only. It is not immigration advice, legal advice, a recommendation about which visa to choose, or an assessment of whether you qualify. Immigration New Zealand remains the authoritative source for visa requirements, fees, processing information, evidence requirements and application instructions.
      </div>
    </main>
    <PublicFooter/>
  </>;
}
