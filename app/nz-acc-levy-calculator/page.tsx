import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import AccLevyCalculator from './AccLevyCalculator';
import {accLevySources,getAccLevySnapshot} from '@/lib/acc-levy';

export const revalidate=86400;

export const metadata:Metadata={
  title:'NZ ACC Levy Calculator 2026/27 | Earners’ Levy Rate & Maximum',
  description:'Estimate the New Zealand ACC earners’ levy for salary and wages using the current 2026/27 rate, maximum liable earnings and confirmed 2027/28 settings.',
  keywords:['ACC levy calculator NZ','ACC levy NZ','ACC earners levy','ACC levy rate 2026','ACC maximum earnings NZ','ACC levy 2026 2027','self employed ACC levy NZ'],
  alternates:{canonical:'/nz-acc-levy-calculator'},
  openGraph:{title:'NZ ACC Levy Calculator 2026/27 | Webfit News',description:'Estimate the current ACC earners’ levy and understand the maximum liable earnings cap.',url:'/nz-acc-levy-calculator',type:'website'},
};

const faq:[string,string][]=[
  ['What is the ACC earners’ levy rate for 2026/27?','For 1 April 2026 to 31 March 2027, Inland Revenue lists the ACC earners’ levy at 1.75%, including GST.'],
  ['What is the maximum liable earnings amount for 2026/27?','The ACC earners’ levy applies to earnings up to $156,641 for 2026/27. The maximum levy is $2,741.22.'],
  ['What is the confirmed rate for 2027/28?','For 1 April 2027 to 31 March 2028, Inland Revenue lists the earners’ levy at 1.83%, with maximum liable earnings of $160,244 and a maximum levy of $2,932.47.'],
  ['Does this calculator work for self-employed ACC invoices?','Not fully. Self-employed ACC invoices can include classification-based Work and Working Safer levies in addition to Earners’ levy, so the total depends on the business activity and cover type.'],
  ['Why can ACC and IRD show different-looking levy rates?','ACC levy-result tables can show rates excluding GST, while Inland Revenue’s payroll earners’ levy rate includes GST. Use the IRD rate for salary and wage deduction estimates.'],
];

export default async function Page(){
  const snapshot=await getAccLevySnapshot();
  const checked=new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(snapshot.checkedAt));
  const faqEntities=faq.map(([q,a])=>({
    '@type':'Question',
    name:q,
    acceptedAnswer:{'@type':'Answer',text:a},
  }));
  const breadcrumbItems=[
    {'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},
    {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://www.webfitnews.com/nz-guides'},
    {'@type':'ListItem',position:3,name:'NZ ACC Levy Calculator',item:'https://www.webfitnews.com/nz-acc-levy-calculator'},
  ];
  const structuredData={
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'WebApplication',
        name:'NZ ACC Levy Calculator 2026/27',
        url:'https://www.webfitnews.com/nz-acc-levy-calculator',
        applicationCategory:'FinanceApplication',
        operatingSystem:'Web',
      },
      {'@type':'FAQPage',mainEntity:faqEntities},
      {'@type':'BreadcrumbList',itemListElement:breadcrumbItems},
    ],
  };

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Webfit News NZ Guides</span>
          <h1>NZ ACC levy calculator 2026/27</h1>
          <p className={styles.lead}>Estimate the ACC Earners’ levy on salary or wages using the current Inland Revenue rate and annual liable-earnings cap.</p>
        </div>
        <div className={styles.heroCard}>
          <span>Current 2026/27 rate</span>
          <strong>1.75%</strong>
          <small>On liable earnings up to $156,641. Maximum annual levy: $2,741.22.</small>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Calculator</span><h2>Estimate your ACC Earners’ levy</h2><p>Use annual salary or wages. You can also compare the confirmed 2027/28 settings.</p></div>
        <AccLevyCalculator/>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Current settings</span><h2>ACC Earners’ levy rates and caps</h2></div>
        <div className={styles.infoGrid}>
          <article><h3>2026/27</h3><p><strong>1.75%</strong> including GST from 1 April 2026 to 31 March 2027. Maximum liable earnings: <strong>$156,641</strong>. Maximum annual levy: <strong>$2,741.22</strong>.</p></article>
          <article><h3>2027/28</h3><p>The confirmed next rate is <strong>1.83%</strong> including GST. Maximum liable earnings: <strong>$160,244</strong>. Maximum levy: <strong>$2,932.47</strong>.</p></article>
          <article><h3>Collected through PAYE</h3><p>For salary and wage earners, the Earners’ levy is generally included in PAYE deductions rather than billed separately by ACC.</p></article>
          <article><h3>Earnings cap</h3><p>The Earners’ levy does not continue increasing once annual liable earnings reach the prescribed maximum for that levy year.</p></article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Self-employed</span><h2>Why a self-employed ACC invoice is different</h2></div>
        <div className={styles.infoGrid}>
          <article><h3>Classification matters</h3><p>Self-employed levies depend on the business activity classification. Work levy rates can differ significantly between industries.</p></article>
          <article><h3>2026/27 liable-income range</h3><p>ACC currently lists standard self-employed liable income from <strong>$50,501</strong> minimum to <strong>$156,641</strong> maximum for 2026/27, subject to the applicable rules.</p></article>
          <article><h3>CoverPlus Extra</h3><p>CoverPlus Extra uses a nominated level of cover rather than standard liable income. ACC currently lists a 2026/27 cover range of <strong>$40,401 to $125,313</strong>.</p></article>
          <article><h3>Use ACC’s estimator</h3><p>For a business or self-employed total levy estimate, use ACC’s official levy estimator because Work and Working Safer levies can also apply.</p></article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Rate terminology</span><h2>Why you may see 1.52% and 1.75% for the same year</h2><p>ACC’s levy-result material can display the underlying Earners’ levy rate excluding GST, while Inland Revenue publishes the rate used for payroll including GST. For 2026/27 those figures are 1.52% excluding GST and 1.75% including GST. This calculator uses the Inland Revenue payroll rate.</p></div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>ACC and Inland Revenue</h2><p>Last checked {checked}. {snapshot.reachable}/{snapshot.total} official source pages responded successfully.</p></div>
        <div className={styles.infoGrid}>{accLevySources.map(source=><article key={source.url}><h3>{source.label}</h3><a href={source.url} target="_blank" rel="noreferrer">Open official source →</a></article>)}</div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>ACC levy questions</h2></div>
        <div className={styles.infoGrid}>{faq.map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div>
      </section>

      <aside className={styles.disclaimer}><strong>Important:</strong> This is a general Earners’ levy estimate, not an ACC invoice calculation or payroll engine. Multiple employers, secondary income, shareholder-employee remuneration, exemptions, classification codes, self-employed cover products and payroll rounding can change the amount. Check ACC and Inland Revenue for your circumstances.</aside>
      <p><Link href="/nz-paye-calculator">NZ PAYE & Tax Calculator →</Link> · <Link href="/nz-guides">Back to NZ Guides</Link></p>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/>
  </>;
}
