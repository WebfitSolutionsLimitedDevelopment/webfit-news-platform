import Link from 'next/link';
import { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { visaDefinitions, VisaCategory } from '@/lib/immigration';
import styles from './Immigration.module.css';

export const metadata: Metadata = {
  title: 'New Zealand Visa Guide | Work, Study, Visit, Family & Residence | Webfit News',
  description: 'A clear New Zealand visa guide organised by work, study, visit, residence and family pathways, with direct links to Immigration New Zealand.',
};

const categories: Array<{name: VisaCategory; id: string; description: string}> = [
  {name: 'Work', id: 'work-visas', description: 'Visas for people coming to New Zealand for employment or staying to work after study.'},
  {name: 'Study', id: 'study-visas', description: 'Visas for international students enrolling with New Zealand education providers.'},
  {name: 'Visit', id: 'visit-visas', description: 'Temporary visas for holidays, visiting family and other short stays.'},
  {name: 'Residence', id: 'residence-visas', description: 'Pathways that may allow eligible people to live in New Zealand permanently.'},
  {name: 'Family', id: 'family-visas', description: 'Visas connected to partners, parents and family relationships.'},
];

export default function ImmigrationHubPage() {
  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Webfit News Immigration Information</span>
        <h1>New Zealand Visa Guide</h1>
        <p className={styles.heroLead}>
          Find New Zealand visa information by purpose, compare the main visa pathways, then open a detailed guide with official Immigration New Zealand links, document information and a downloadable checklist.
        </p>
        <div className={styles.notice}>
          <strong>General information only.</strong> Webfit News does not provide immigration advice or assess personal eligibility. Visa rules can change, so always confirm the current requirements on the official Immigration New Zealand website before applying.
        </div>
      </section>

      <nav className={styles.jumpNav} aria-label="Visa guide sections">
        <span>Jump to:</span>
        {categories.map(category => <a key={category.id} href={`#${category.id}`}>{category.name}</a>)}
        <Link href="/category/immigration">Immigration News</Link>
      </nav>

      <section className={styles.introGrid} aria-label="How to use this guide">
        <div>
          <strong>1. Choose your purpose</strong>
          <p>Start with work, study, visit, residence or family.</p>
        </div>
        <div>
          <strong>2. Compare visa options</strong>
          <p>Use the tables below to quickly understand what each visa is generally for.</p>
        </div>
        <div>
          <strong>3. Open the full guide</strong>
          <p>Each visa name links to a dedicated Webfit News guide with official source links.</p>
        </div>
      </section>

      {categories.map((category) => {
        const visas = visaDefinitions.filter((visa) => visa.category === category.name);
        if (!visas.length) return null;

        return <section key={category.id} id={category.id} className={styles.category}>
          <div className={styles.categoryHeading}>
            <div>
              <span className={styles.sectionLabel}>{category.name}</span>
              <h2>{category.name} visas</h2>
              <p>{category.description}</p>
            </div>
            <a className={styles.backTop} href="#top">Back to top ↑</a>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.visaTable}>
              <thead>
                <tr>
                  <th>Visa</th>
                  <th>What it is generally for</th>
                  <th>Category</th>
                  <th>Guide</th>
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
                    <Link className={styles.openGuide} href={`/immigration/${visa.slug}`}>View guide →</Link>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </section>;
      })}

      <section className={styles.newsPanel}>
        <div>
          <span className={styles.sectionLabel}>Latest developments</span>
          <h2>New Zealand immigration news and visa changes</h2>
          <p>Read Webfit News coverage of Immigration New Zealand announcements, work rights, policy changes, visa settings and other immigration developments.</p>
        </div>
        <Link className={styles.newsLink} href="/category/immigration">Go to Immigration News →</Link>
      </section>

      <section className={styles.sourcePanel}>
        <h2>About this visa information</h2>
        <p>
          Webfit News reorganises publicly available information from Immigration New Zealand into a simpler reference format. Detailed visa guides include direct links to the relevant official pages and show when the source information was last checked.
        </p>
        <p>
          You can also use the Webfit News language selector and listen-aloud accessibility features while reading these guides.
        </p>
      </section>

      <div className={styles.disclaimer}>
        <strong>Information notice:</strong> This section is provided for general informational convenience only. It is not immigration advice, legal advice, a recommendation about which visa to choose, or an assessment of whether you qualify. Immigration New Zealand remains the authoritative source for visa requirements, fees, processing information, evidence requirements and application instructions.
      </div>
    </main>
    <PublicFooter/>
  </>;
}
