import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { getMinimumWageSnapshot, minimumWageSources, MINIMUM_WAGE_REFRESH_SECONDS } from '@/lib/minimum-wage';
import { MinimumWageCalculator } from './MinimumWageCalculator';
import styles from './MinimumWage.module.css';

export const revalidate = MINIMUM_WAGE_REFRESH_SECONDS;

export const metadata: Metadata = {
  title: 'Minimum Wage NZ 2026 | New Zealand Minimum Wage Rates & Calculator',
  description: 'Current New Zealand minimum wage rates for 2026, including adult, starting-out and training minimum wage. Check weekly and annual pay, eligibility rules and official government sources.',
  keywords: [
    'minimum wage nz',
    'New Zealand minimum wage',
    'minimum wage New Zealand 2026',
    'adult minimum wage NZ',
    'starting out wage NZ',
    'training minimum wage NZ',
    'minimum wage calculator NZ',
  ],
  alternates: { canonical: '/minimum-wage' },
  openGraph: {
    title: 'Minimum Wage NZ 2026 | Current New Zealand Rates',
    description: 'Current NZ minimum wage rates, practical explanations, calculator and direct links to official government sources.',
    url: '/minimum-wage',
    type: 'website',
  },
};

function formatNZDate(value: string) {
  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Pacific/Auckland',
    timeZoneName: 'short',
  }).format(new Date(value));
}

function money(value: number) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
  }).format(value);
}

export default async function MinimumWagePage() {
  const wage = await getMinimumWageSnapshot();
  const weeklyAdult = wage.adultHourly * 40;
  const fortnightAdult = weeklyAdult * 2;
  const annualAdult = weeklyAdult * 52;

  const faq = [
    {
      q: 'What is the minimum wage in New Zealand in 2026?',
      a: `From 1 April 2026, the adult minimum wage in New Zealand is ${money(wage.adultHourly)} per hour before tax. The starting-out and training minimum wage rates are ${money(wage.startingOutHourly)} per hour.`,
    },
    {
      q: 'Who gets the adult minimum wage in NZ?',
      a: 'In general, employees aged 16 or over must receive at least the adult minimum wage unless they meet the legal criteria for the starting-out or training minimum wage. Workers who supervise or train other workers must receive at least the adult minimum wage.',
    },
    {
      q: 'Is there a minimum wage for workers under 16 in New Zealand?',
      a: 'There is no statutory minimum wage for employees under 16. Other employment rights and restrictions can still apply.',
    },
    {
      q: 'Are migrant workers entitled to the NZ minimum wage?',
      a: 'Yes. Migrant workers have the same minimum employment rights as New Zealand workers, including the right to be paid at least the applicable minimum wage.',
    },
    {
      q: 'What can I do if I am paid less than minimum wage?',
      a: 'Employment New Zealand says workers who believe they are being paid below the minimum wage can contact its service on 0800 20 90 20. Keep records such as payslips, timesheets and employment agreements.',
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: 'Minimum Wage NZ 2026',
        url: 'https://www.webfitnews.com/minimum-wage',
        description: metadata.description,
        dateModified: wage.checkedAt,
        isPartOf: { '@type': 'WebSite', name: 'Webfit News', url: 'https://www.webfitnews.com' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>New Zealand Pay Guide</span>
          <h1>Minimum Wage NZ 2026</h1>
          <p className={styles.lead}>Current New Zealand minimum wage rates, who they apply to, what a 40-hour week pays, and where to check the official rules.</p>
          <div className={styles.freshness}>
            <span className={wage.sourceStatus === 'live' ? styles.liveDot : styles.fallbackDot}/>
            <strong>Government sources checked:</strong> {formatNZDate(wage.checkedAt)} · Refreshes every 48 hours
          </div>
        </div>
        <div className={styles.heroRate}>
          <span>Adult minimum wage</span>
          <strong>{money(wage.adultHourly)}</strong>
          <small>per hour before tax · effective 1 April 2026</small>
        </div>
      </section>

      <nav className={styles.jumpNav} aria-label="Minimum wage sections">
        <span>Jump to:</span>
        <a href="#rates">Current rates</a>
        <a href="#who-gets-what">Who gets what</a>
        <a href="#calculator">Calculator</a>
        <a href="#rights">Your rights</a>
        <a href="#sources">Official sources</a>
        <a href="#faq">FAQs</a>
      </nav>

      <section id="rates" className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Current rates</span>
          <h2>New Zealand minimum wage rates from 1 April 2026</h2>
          <p>These are gross rates before tax and lawful deductions.</p>
        </div>

        <div className={styles.rateGrid}>
          <article className={styles.rateCard}>
            <span>Adult minimum wage</span>
            <strong>{money(wage.adultHourly)}<small>/hour</small></strong>
            <p>For most employees aged 16 and over.</p>
          </article>
          <article className={styles.rateCard}>
            <span>Starting-out minimum wage</span>
            <strong>{money(wage.startingOutHourly)}<small>/hour</small></strong>
            <p>Only for workers who meet specific age, employment or training criteria.</p>
          </article>
          <article className={styles.rateCard}>
            <span>Training minimum wage</span>
            <strong>{money(wage.trainingHourly)}<small>/hour</small></strong>
            <p>For eligible workers aged 20+ doing qualifying industry training.</p>
          </article>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.wageTable}>
            <thead><tr><th>Rate</th><th>Per hour</th><th>8-hour day</th><th>40-hour week</th><th>80-hour fortnight</th></tr></thead>
            <tbody>
              <tr><td>Adult</td><td>{money(wage.adultHourly)}</td><td>{money(wage.adultHourly * 8)}</td><td>{money(weeklyAdult)}</td><td>{money(fortnightAdult)}</td></tr>
              <tr><td>Starting-out</td><td>{money(wage.startingOutHourly)}</td><td>{money(wage.startingOutHourly * 8)}</td><td>{money(wage.startingOutHourly * 40)}</td><td>{money(wage.startingOutHourly * 80)}</td></tr>
              <tr><td>Training</td><td>{money(wage.trainingHourly)}</td><td>{money(wage.trainingHourly * 8)}</td><td>{money(wage.trainingHourly * 40)}</td><td>{money(wage.trainingHourly * 80)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className={styles.note}>At the adult minimum wage, 40 hours a week is {money(weeklyAdult)} before tax, or about {money(annualAdult)} over 52 weeks.</p>
      </section>

      <section id="who-gets-what" className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Eligibility</span>
          <h2>Which minimum wage applies to you?</h2>
        </div>
        <div className={styles.infoGrid}>
          <article><h3>Adult minimum wage</h3><p>Generally applies if you are 16 or older and you are not legally classed as a starting-out worker or trainee.</p><p>If your job includes supervising or training other workers, Employment New Zealand says you must be paid at least the adult minimum wage.</p></article>
          <article><h3>Starting-out wage</h3><p>Can apply to some 16 and 17 year olds during their first six continuous months with an employer, some 18 and 19 year olds coming off specified benefits, and some 16 to 19 year olds doing qualifying industry training.</p></article>
          <article><h3>Training wage</h3><p>Can apply to employees aged 20 or over whose employment agreement requires at least 60 credits a year of recognised industry training to become qualified.</p></article>
          <article><h3>Workers under 16</h3><p>New Zealand does not set a statutory minimum wage for employees under 16. School-age work restrictions and other employment protections may still apply.</p></article>
        </div>
      </section>

      <div id="calculator"><MinimumWageCalculator adultRate={wage.adultHourly} startingOutRate={wage.startingOutHourly} trainingRate={wage.trainingHourly}/></div>

      <section id="rights" className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Practical rights</span>
          <h2>Minimum wage rules people commonly ask about</h2>
        </div>
        <div className={styles.rightsList}>
          <div><strong>Migrant workers</strong><p>Migrant workers have the same minimum employment rights as New Zealand workers, including minimum wage protections.</p></div>
          <div><strong>Extra time worked</strong><p>Employers must pay for actual hours worked. If extra time would take your effective hourly pay below the minimum wage, that can be a problem even if you receive a salary.</p></div>
          <div><strong>Before tax</strong><p>Minimum wage figures are gross amounts. PAYE and other lawful deductions can reduce the amount that reaches your bank account.</p></div>
          <div><strong>Paid below minimum wage?</strong><p>Keep payslips, rosters, timesheets and your employment agreement. Employment New Zealand lists 0800 20 90 20 for minimum wage concerns.</p></div>
        </div>
      </section>

      <section id="sources" className={styles.sources}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Official sources</span>
          <h2>Where this minimum wage information comes from</h2>
          <p>Webfit News checks official New Zealand government pages every 48 hours and presents the key information in a simpler format. The government sites remain the authoritative source.</p>
        </div>
        <div className={styles.sourceList}>
          {minimumWageSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
            <div><strong>{source.name}</strong><span>{source.primary ? 'Primary rate source' : 'Official cross-check'}</span></div><span>Open official page ↗</span>
          </a>)}
        </div>
        <p className={styles.sourceMeta}>Last source check: {formatNZDate(wage.checkedAt)} · {wage.sourcesChecked} of {minimumWageSources.length} official pages responded during this refresh.</p>
      </section>

      <section id="faq" className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>FAQs</span>
          <h2>Minimum wage NZ: common questions</h2>
        </div>
        <div className={styles.faqList}>
          {faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}
        </div>
      </section>

      <aside className={styles.disclaimer}>
        <strong>Information notice:</strong> This page is general information, not legal, tax or employment advice. Webfit News summarises official public information for convenience. Always use the linked government pages for the latest legal requirements or advice about your circumstances.
      </aside>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}/>
  </>;
}
