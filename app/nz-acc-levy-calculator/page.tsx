import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import AccLevyCalculator from './AccLevyCalculator';
import {accLevySources,getAccLevySnapshot} from '@/lib/acc-levy';

export const revalidate=86400;
export const metadata:Metadata={
  title:'ACC Levy Calculator NZ 2026/27 | 1.75% Earners’ Levy',
  description:'Calculate the NZ ACC Earners’ levy on salary or wages. Current 2026/27 rate is 1.75% up to $156,641, with a maximum annual levy of $2,741.22.',
  keywords:['ACC levy calculator NZ','ACC levy NZ','ACC earners levy','ACC levy rate 2026','ACC maximum earnings NZ','ACC earners levy calculator'],
  alternates:{canonical:'/nz-acc-levy-calculator'},
  openGraph:{title:'ACC Levy Calculator NZ 2026/27 | 1.75% Earners’ Levy',description:'Estimate the ACC Earners’ levy on New Zealand salary or wages and check the current earnings cap.',url:'/nz-acc-levy-calculator',type:'website'},
};
const faq:[string,string][]=[
  ['What is the ACC levy rate for employees in 2026/27?','The ACC Earners’ levy collected with PAYE is 1.75% including GST from 1 April 2026 to 31 March 2027.'],
  ['How much ACC levy do I pay on a $100,000 salary?','At the 2026/27 employee Earners’ levy rate of 1.75%, an annual salary of $100,000 produces an indicative levy of $1,750 because the salary is below the maximum liable-earnings cap.'],
  ['What is the maximum ACC Earners’ levy for 2026/27?','The levy applies to liable earnings up to $156,641, making the maximum annual Earners’ levy $2,741.22 for 2026/27.'],
  ['What is the ACC levy rate for 2027/28?','Inland Revenue lists the confirmed 2027/28 Earners’ levy at 1.83% including GST, with maximum liable earnings of $160,244 and a maximum levy of $2,932.47.'],
  ['Is the ACC Earners’ levy included in PAYE?','Yes. Inland Revenue collects the employee Earners’ levy along with PAYE. Almost all employee earnings subject to PAYE are liable up to the annual maximum.'],
  ['Does this calculate a self-employed ACC invoice?','No. Self-employed and business levies can also depend on business classification, Work levy, Working Safer levy and cover type. Use ACC’s official levy calculators for the full invoice estimate.'],
];

export default async function Page(){
  const snapshot=await getAccLevySnapshot();
  const checked=new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(snapshot.checkedAt));
  const faqEntities=faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}));
  const structuredData={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebApplication',name:'ACC Levy Calculator NZ 2026/27',url:'https://webfitnews.com/nz-acc-levy-calculator',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
      {'@type':'FAQPage',mainEntity:faqEntities},
      {'@type':'BreadcrumbList',itemListElement:[
        {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
        {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
        {'@type':'ListItem',position:3,name:'ACC Levy Calculator NZ',item:'https://webfitnews.com/nz-acc-levy-calculator'},
      ]},
    ],
  };

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Salary & ACC Tool</span><h1>ACC Levy Calculator NZ 2026/27</h1><p className={styles.lead}>Calculate the ACC Earners’ levy on your salary or wages using the current 1.75% payroll rate and the $156,641 annual liable-earnings cap.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>ACC/IRD sources checked:</strong> {snapshot.reachable}/{snapshot.total} · {checked}</div></div><div className={styles.heroCard}><span>Current employee Earners’ levy</span><strong>1.75%</strong><small>Maximum annual levy $2,741.22 in 2026/27.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>ACC levy calculator</span><h2>Calculate your ACC Earners’ levy</h2><p>Enter annual salary or wages to estimate the levy collected with PAYE. You can also compare the confirmed 2027/28 rate.</p></div><AccLevyCalculator/></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Quick answer</span><h2>ACC levy rate and maximum for 2026/27</h2></div><div className={styles.infoGrid}>
      <article><h3>Rate: 1.75%</h3><p>Inland Revenue lists the employee Earners’ levy as <strong>$1.75 per $100</strong> of liable earnings, including GST.</p></article>
      <article><h3>Earnings cap: $156,641</h3><p>The levy stops increasing after annual liable earnings reach the prescribed 2026/27 maximum.</p></article>
      <article><h3>Maximum levy: $2,741.22</h3><p>This is the maximum 2026/27 Earners’ levy on salary or wages under the standard annual cap.</p></article>
      <article><h3>Collected with PAYE</h3><p>Employees generally do not receive a separate ACC invoice for this levy; Inland Revenue collects it with PAYE.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Worked example</span><h2>ACC levy on a $100,000 salary</h2><p>$100,000 is below the 2026/27 liable-earnings cap. At 1.75%, the indicative annual ACC Earners’ levy is <strong>$1,750</strong>. PAYE calculations and payroll rounding are separate from this simple annual levy example.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Next year</span><h2>Confirmed ACC Earners’ levy for 2027/28</h2></div><div className={styles.infoGrid}>
      <article><h3>1.83% rate</h3><p>From 1 April 2027, Inland Revenue lists the employee Earners’ levy at 1.83% including GST.</p></article>
      <article><h3>$160,244 cap</h3><p>Maximum liable earnings rise to $160,244.</p></article>
      <article><h3>$2,932.47 maximum</h3><p>The corresponding maximum annual levy is $2,932.47.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Self-employed & business</span><h2>This calculator is not a full ACC business invoice calculator</h2></div><div className={styles.infoGrid}>
      <article><h3>Business classification matters</h3><p>Self-employed and employer Work levy rates depend on the applicable business classification or CU code.</p></article>
      <article><h3>Self-employed income limits</h3><p>ACC currently lists the standard 2026/27 self-employed liable-income range as $50,501 minimum to $156,641 maximum, subject to its rules.</p></article>
      <article><h3>CoverPlus Extra differs</h3><p>CoverPlus Extra uses a nominated cover amount rather than the standard liable-income calculation.</p></article>
      <article><h3>Use ACC’s calculators</h3><p>For the complete business or self-employed levy, use ACC’s official calculators because additional levy components can apply.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>ACC and Inland Revenue levy information</h2><p>Last checked {checked}. {snapshot.reachable}/{snapshot.total} official source pages responded successfully.</p></div><div className={styles.infoGrid}>{accLevySources.map(source=><article key={source.url}><h3>{source.label}</h3><a href={source.url} target="_blank" rel="noreferrer">Open official source →</a></article>)}</div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>ACC levy calculator questions</h2></div><div className={styles.infoGrid}>{faq.map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></section>

    <aside className={styles.disclaimer}><strong>Important:</strong> This is a general employee Earners’ levy estimate, not an ACC invoice calculation or payroll engine. Multiple employers, exemptions, classification codes, self-employed cover products and payroll rounding can change the amount.</aside><p><Link href="/nz-paye-calculator">Calculate NZ PAYE and take-home pay →</Link> · <Link href="/nz-guides">Browse all NZ Guides →</Link></p>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/></>;
}
