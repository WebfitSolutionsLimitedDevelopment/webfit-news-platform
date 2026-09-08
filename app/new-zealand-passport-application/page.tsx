import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { getPassportSnapshot, passportSources } from '@/lib/passport-renewal';
import styles from '@/components/UtilityGuide.module.css';

export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'New Zealand Passport Application 2026 | NZ Passport Cost, Time & Requirements',
  description: 'Apply for a New Zealand passport with current adult and child passport costs, processing times, first passport requirements, identity referee rules, photos and official application links.',
  keywords: [
    'new zealand passport application',
    'NZ passport application',
    'New Zealand passport',
    'apply for NZ passport',
    'first NZ passport',
    'child passport NZ',
    'adult passport NZ',
    'NZ passport cost',
    'NZ passport processing time',
  ],
  alternates: { canonical: '/new-zealand-passport-application' },
  openGraph: {
    title: 'New Zealand Passport Application 2026',
    description: 'Current NZ passport application costs, processing times, requirements and official application links.',
    url: '/new-zealand-passport-application',
    type: 'website',
  },
};

const formatNZDate = (value: string) => new Intl.DateTimeFormat('en-NZ', {
  day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
  timeZone: 'Pacific/Auckland', timeZoneName: 'short',
}).format(new Date(value));

export default async function NewZealandPassportApplicationPage() {
  const snapshot = await getPassportSnapshot();
  const faq = [
    { q: 'Who can apply for a New Zealand passport?', a: 'You must be a New Zealand citizen to apply for a New Zealand passport.' },
    { q: 'How much is a New Zealand passport in 2026?', a: `The current standard fee is NZD $${snapshot.adultStandard} for an adult passport and NZD $${snapshot.childStandard} for a child passport, plus courier delivery.` },
    { q: 'How long does a New Zealand passport application take?', a: `NZ Passports currently says to allow at least ${snapshot.standardTime} for standard processing, plus delivery time. Urgent applications aim for ${snapshot.urgentTime}.` },
    { q: 'What do I need for a first New Zealand passport?', a: 'You generally need proof of entitlement to a New Zealand passport where required, a compliant passport photo, an identity referee or witness, payment and delivery details.' },
    { q: 'Does a child need a separate New Zealand passport?', a: 'Yes. Children aged 15 and under apply for a child passport, which is valid for up to 5 years. Parental or guardian consent requirements apply.' },
  ];
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: 'New Zealand Passport Application 2026',
        url: 'https://www.webfitnews.com/new-zealand-passport-application',
        dateModified: snapshot.checkedAt,
        isPartOf: { '@type': 'WebSite', name: 'Webfit News', url: 'https://www.webfitnews.com' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'NZ Guides', item: 'https://www.webfitnews.com/nz-guides' },
          { '@type': 'ListItem', position: 2, name: 'New Zealand Passport Application', item: 'https://www.webfitnews.com/new-zealand-passport-application' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
      },
    ],
  };

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>New Zealand Passport Guide</span>
          <h1>New Zealand Passport Application 2026</h1>
          <p className={styles.lead}>A practical guide for first-time, adult and child NZ passport applications, with current official costs, processing times and direct government application links.</p>
          <div className={styles.freshness}><span className={snapshot.sourceOk ? styles.liveDot : styles.fallbackDot}/><strong>Official NZ Passports sources checked:</strong> {formatNZDate(snapshot.checkedAt)}</div>
        </div>
        <div className={styles.heroCard}>
          <span>Standard adult passport</span>
          <strong>NZD ${snapshot.adultStandard}</strong>
          <small>Courier delivery is additional. Adult passports are generally valid for up to 10 years.</small>
        </div>
      </section>

      <nav className={styles.jumpNav} aria-label="Passport application sections">
        <span>Jump to:</span><a href="#who">Who can apply</a><a href="#cost">Cost</a><a href="#time">Processing time</a><a href="#need">What you need</a><a href="#child">Child passport</a><a href="#apply">Apply</a><a href="#faq">FAQs</a>
      </nav>

      <section id="who" className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Eligibility</span><h2>Who can apply for a New Zealand passport?</h2><p>You must be a New Zealand citizen. If you were born overseas to a New Zealand parent, you may need to register your citizenship by descent before a passport can be issued.</p></div>
        <div className={styles.infoGrid}>
          <article><h3>First NZ passport</h3><p>Use the general passport application process. Additional identity and citizenship checks can apply, so first applications can take longer.</p></article>
          <article><h3>Renewing instead?</h3><p>If you already hold or previously held a New Zealand passport, use our dedicated renewal guide.</p><Link className={styles.cta} href="/nz-passport-renewal">Open NZ passport renewal guide →</Link></article>
        </div>
      </section>

      <section id="cost" className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Current fees</span><h2>NZ passport application cost</h2><p>These are the current official passport fees for applications processed in New Zealand. Courier delivery is extra.</p></div>
        <div className={styles.cardGrid}>
          <article className={styles.card}><h3>Adult standard</h3><p>NZD ${snapshot.adultStandard}</p></article>
          <article className={styles.card}><h3>Child standard</h3><p>NZD ${snapshot.childStandard}</p></article>
          <article className={styles.card}><h3>Adult urgent</h3><p>NZD ${snapshot.adultUrgent}</p></article>
        </div>
      </section>

      <section id="time" className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Timing</span><h2>New Zealand passport processing time</h2></div>
        <div className={styles.infoGrid}>
          <article><h3>Standard service</h3><p>Allow at least {snapshot.standardTime}, then add courier delivery time.</p></article>
          <article><h3>Urgent service</h3><p>Urgent applications aim to be processed within {snapshot.urgentTime}. First-time and child applications may need additional checks.</p></article>
        </div>
      </section>

      <section id="need" className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Application checklist</span><h2>What you need for an NZ passport application</h2></div>
        <div className={styles.cardGrid}>
          <article className={styles.card}><h3>Passport photo</h3><p>A recent compliant passport photo. NZ Passports warns that selfies and photos that do not meet technical requirements can delay an application.</p></article>
          <article className={styles.card}><h3>Identity referee or witness</h3><p>For online applications, an eligible identity referee must generally be aged 16 or older, have known you for more than one year, hold a current or expired NZ passport, and not be related to you, your partner, or living at your address.</p></article>
          <article className={styles.card}><h3>Citizenship and previous passport details</h3><p>You may need citizenship or entitlement information, and previous passport details if you have held one before.</p></article>
        </div>
      </section>

      <section id="child" className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Children aged 15 and under</span><h2>Child passport application NZ</h2><p>A child needs their own passport. Child passports are valid for up to 5 years. A parent or legal guardian must provide the required consent, and first child applications can involve additional citizenship checks.</p></div>
        <div className={styles.notice}><strong>Current standard child passport fee:</strong> NZD ${snapshot.childStandard}, plus courier delivery.</div>
      </section>

      <section id="apply" className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Official application</span><h2>Apply for a New Zealand passport</h2><p>Most New Zealand citizens can apply online. If you need a paper form, the official NZ Passports website provides separate adult, renewal and child application forms.</p>
          <a className={styles.cta} href="https://www.passports.govt.nz/most-citizens-can-apply-for-their-passport-online/most-citizens-can-apply-for-their-passport-online" target="_blank" rel="noopener noreferrer">Start on the official NZ Passports website ↗</a>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Where this information comes from</h2></div>
        <div className={styles.sourceList}>{passportSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><div><strong>{source.name}</strong><small>{source.primary ? 'Primary fee source' : 'Official NZ Passports source'}</small></div><span>Open official page ↗</span></a>)}</div>
        <div className={styles.sourceList} style={{marginTop:10}}>
          <a href="https://www.passports.govt.nz/what-you-need-for-your-application/identity-referee-or-witness" target="_blank" rel="noopener noreferrer"><div><strong>New Zealand Passports — Identity referee or witness</strong><small>Official identity requirements</small></div><span>Open official page ↗</span></a>
          <a href="https://www.passports.govt.nz/paper-application-forms" target="_blank" rel="noopener noreferrer"><div><strong>New Zealand Passports — Paper application forms</strong><small>Adult, renewal and child forms</small></div><span>Open official page ↗</span></a>
        </div>
      </section>

      <section id="faq" className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>New Zealand passport application: common questions</h2></div>
        <div className={styles.faqList}>{faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
      </section>

      <aside className={styles.disclaimer}><strong>Information notice:</strong> Passport fees, timeframes and eligibility requirements can change. The Department of Internal Affairs / NZ Passports website remains the authoritative source.</aside>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(ld).replace(/</g,'\\u003c')}}/>
  </>;
}
