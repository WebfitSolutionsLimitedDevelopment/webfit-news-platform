import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import NzSuperEligibilityChecker from './NzSuperEligibilityChecker';
import { getNzSuperSnapshot, nzSuperSources } from '@/lib/nz-super';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'NZ Superannuation 2026 | Eligibility, Rates & Residence Rules',
  description: 'Check NZ Super eligibility, current 2026 fortnightly rates, residence requirements, overseas pension rules and payment timing using official Work and Income sources.',
  keywords: ['NZ Superannuation', 'NZ Super rates 2026', 'NZ Super eligibility', 'NZ Super residence requirements', 'New Zealand pension', 'NZ pension age', 'NZ Super payment rates'],
  alternates: { canonical: '/nz-superannuation' },
  openGraph: {
    title: 'NZ Superannuation 2026 | Webfit News',
    description: 'Current NZ Super eligibility rules, 2026 rates and residence requirements.',
    url: '/nz-superannuation',
    type: 'website',
  },
};

const residenceRows = [
  ['On or before 30 June 1959', '10 years'],
  ['1 July 1959–30 June 1961', '11 years'],
  ['1 July 1961–30 June 1963', '12 years'],
  ['1 July 1963–30 June 1965', '13 years'],
  ['1 July 1965–30 June 1967', '14 years'],
  ['1 July 1967–30 June 1969', '15 years'],
  ['1 July 1969–30 June 1971', '16 years'],
  ['1 July 1971–30 June 1973', '17 years'],
  ['1 July 1973–30 June 1975', '18 years'],
  ['1 July 1975–30 June 1977', '19 years'],
  ['On or after 1 July 1977', '20 years'],
] as const;

const rateRows = [
  ['Single, living alone', '$1,110.30', '$1,294.74'],
  ['Single, sharing accommodation', '$1,024.90', '$1,191.14'],
  ['Couple — only one qualifies', '$854.08', '$984.28'],
  ['Couple — both qualify, each', '$854.08', '$984.28'],
  ['Couple — both qualify, combined', '$1,708.16', '$1,968.56'],
] as const;

const faq = [
  ['What age can you get NZ Super?', 'Generally from age 65, if you also meet citizenship or residence-class status, ordinary-residence and residence-duration rules.'],
  ['How many years must I have lived in New Zealand?', 'The standard requirement is based on date of birth and ranges from 10 to 20 years from age 20. It must include at least 5 years from age 50.'],
  ['Does my partner need to qualify?', 'No. A qualifying person can receive the applicable partnered rate even if their partner does not qualify. Older grandparented non-qualified-partner arrangements have separate rules.'],
  ['Can an overseas pension affect NZ Super?', 'Yes. If you or your partner qualify for an overseas pension, Work and Income says you must apply for it and it can affect NZ Super.'],
  ['How often is NZ Super paid?', 'NZ Super is normally paid fortnightly on a Tuesday.'],
] as const;

export default async function NzSuperannuationPage() {
  const snapshot = await getNzSuperSnapshot();
  const checked = new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Pacific/Auckland',
  }).format(new Date(snapshot.checkedAt));

  const faqEntities = faq.map(([question, answer]) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'NZ Superannuation Eligibility Checker',
        url: 'https://www.webfitnews.com/nz-superannuation',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqEntities,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Webfit News', item: 'https://www.webfitnews.com' },
          { '@type': 'ListItem', position: 2, name: 'NZ Guides', item: 'https://www.webfitnews.com/nz-guides' },
          { '@type': 'ListItem', position: 3, name: 'NZ Superannuation', item: 'https://www.webfitnews.com/nz-superannuation' },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className={`shell ${styles.page}`}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Webfit News NZ Guides</span>
            <h1>NZ Superannuation 2026</h1>
            <p className={styles.lead}>Check the core eligibility rules, residence requirement and current rates before applying through Work and Income.</p>
          </div>
          <div className={styles.heroCard}>
            <span>Current standard age</span>
            <strong>65+</strong>
            <small>Residence rules depend on date of birth.</small>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <span className={styles.kicker}>Eligibility checker</span>
            <h2>Do you appear to meet the core NZ Super rules?</h2>
          </div>
          <NzSuperEligibilityChecker />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <span className={styles.kicker}>Current rates</span>
            <h2>NZ Super rates from 1 April 2026</h2>
            <p>Fortnightly amounts below use the Work and Income standard-rate table. Net amounts shown use tax code M.</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Situation</th><th>Fortnightly after tax (M)</th><th>Fortnightly before tax</th></tr></thead>
              <tbody>{rateRows.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <span className={styles.kicker}>Residence test</span>
            <h2>How many years must you have lived in NZ?</h2>
            <p>The years must be from age 20 and include at least five years from age 50. They do not have to be consecutive.</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Date of birth</th><th>Required NZ residence from age 20</th></tr></thead>
              <tbody>{residenceRows.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td></tr>)}</tbody>
            </table>
          </div>
          <p>Time in a Social Security Agreement country or an NZ Realm country may help in some cases. Refugees and protected persons can have different residence calculations.</p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><span className={styles.kicker}>Important</span><h2>Overseas pensions and tax</h2></div>
          <div className={styles.infoGrid}>
            <article><h3>Overseas pension</h3><p>If you or your partner qualify for an overseas pension, Work and Income says you must apply for it. It may affect the amount of NZ Super you receive.</p></article>
            <article><h3>Tax code</h3><p>NZ Super is taxable. Your correct tax code depends on whether NZ Super is your main or secondary source of income.</p><Link href="/nz-tax-code-finder">Use the NZ tax code finder →</Link></article>
            <article><h3>Payment timing</h3><p>NZ Super is normally paid fortnightly on Tuesday. Public holidays can bring a payment forward.</p></article>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Checked against Work and Income</h2><p>Last checked {checked}. {snapshot.reachable}/{snapshot.total} official source pages responded successfully.</p></div>
          <div className={styles.infoGrid}>{nzSuperSources.map((source) => <article key={source.url}><h3>{source.label}</h3><a href={source.url} target="_blank" rel="noreferrer">Open official source →</a></article>)}</div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ Super questions</h2></div>
          <div className={styles.infoGrid}>{faq.map(([question, answer]) => <article key={question}><h3>{question}</h3><p>{answer}</p></article>)}</div>
        </section>

        <aside className={styles.disclaimer}><strong>Important:</strong> This guide is general information only. Work and Income makes the eligibility and payment decision. Overseas residence, overseas pensions, relationship status and tax circumstances can materially change the result.</aside>
      </main>
      <PublicFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    </>
  );
}
