import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import KiwiSaverCalculator from './KiwiSaverCalculator';
import {getKiwiSaverSnapshot,kiwiSaverSources} from '@/lib/kiwisaver';

export const revalidate=604800;

export const metadata:Metadata={
  title:'NZ KiwiSaver Calculator 2026 | Employee, Employer, ESCT & Government Contribution',
  description:'Estimate New Zealand KiwiSaver employee and employer contributions, ESCT and government contribution using current 2026 IRD settings.',
  keywords:['KiwiSaver calculator NZ','NZ KiwiSaver calculator','KiwiSaver employer contribution','KiwiSaver contribution rates 2026','ESCT calculator','KiwiSaver government contribution'],
  alternates:{canonical:'/nz-kiwisaver-calculator'},
  openGraph:{title:'NZ KiwiSaver Calculator 2026 | Webfit News',description:'Estimate employee, employer, ESCT and government KiwiSaver contributions under current IRD settings.',url:'/nz-kiwisaver-calculator',type:'website'},
};

function formatChecked(value:string){return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(value));}

export default async function KiwiSaverPage(){
  const snapshot=await getKiwiSaverSnapshot();
  const faq=[
    {q:'What is the default KiwiSaver contribution rate in 2026?',a:'From 1 April 2026, the default employee and matching employer KiwiSaver contribution rate is 3.5%. The default is scheduled to rise to 4% from 1 April 2028.'},
    {q:'Can I still contribute 3%?',a:'A temporary rate reduction can allow an employee to contribute 3% for between 3 and 12 months. An employer may choose to match that temporary 3% rate.'},
    {q:'What employee KiwiSaver rates can I choose?',a:'The standard employee contribution rates are 3.5%, 4%, 6%, 8% and 10% of gross pay. A temporary 3% reduction may apply if approved.'},
    {q:'Is the employer contribution paid fully into my KiwiSaver?',a:'Usually not. Employer KiwiSaver contributions are generally subject to employer superannuation contribution tax, or ESCT, so the amount reaching the account is lower than the gross employer contribution.'},
    {q:'How much is the current government KiwiSaver contribution?',a:'From 1 July 2025 the government contributes 25 cents for each eligible dollar contributed, up to a maximum of $260.72 a year. People with taxable income above $180,000 do not qualify.'},
  ];
  const ld={'@context':'https://schema.org','@graph':[
    {'@type':'WebApplication',name:'NZ KiwiSaver Calculator',url:'https://www.webfitnews.com/nz-kiwisaver-calculator',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
    {'@type':'FAQPage',mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://www.webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'NZ KiwiSaver Calculator',item:'https://www.webfitnews.com/nz-kiwisaver-calculator'}]},
  ]};

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Money Guide</span><h1>NZ KiwiSaver Calculator 2026</h1><p className={styles.lead}>Estimate what you contribute, what your employer contributes after ESCT, and the government contribution that may be added under the current KiwiSaver settings.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>IRD sources checked:</strong> {snapshot.sourcesChecked}/{snapshot.totalSources} · {formatChecked(snapshot.checkedAt)}</div></div><div className={styles.heroCard}><span>Current default</span><strong>3.5% employee + 3.5% employer</strong><small>Default rises to 4% from 1 April 2028.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Calculator</span><h2>Estimate your annual KiwiSaver contributions</h2><p>Enter gross salary and contribution rates. The result estimates standard ESCT on the employer contribution and the current government contribution where eligible.</p></div><KiwiSaverCalculator/></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>2026 settings</span><h2>Current KiwiSaver contribution rules</h2></div><div className={styles.infoGrid}>
      <article><h3>Employee rates</h3><p>The current default is 3.5%. Employees can choose 4%, 6%, 8% or 10%. A temporary reduction to 3% can apply for 3 to 12 months.</p></article>
      <article><h3>Employer minimum</h3><p>From 1 April 2026, the compulsory employer contribution is generally 3.5% of gross salary or wages for eligible employees, subject to KiwiSaver rules and ESCT.</p></article>
      <article><h3>Government contribution</h3><p>The government currently contributes 25 cents per eligible dollar contributed, capped at $260.72 a year. Taxable income above $180,000 removes eligibility.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>ESCT</span><h2>Why the employer amount is lower than 3.5% in your account</h2><p>Employer contributions are generally taxed using ESCT. Current thresholds are 10.5% up to $18,720, 17.5% to $64,200, 30% to $93,720, 33% to $216,000 and 39% above that. The applicable threshold is based on salary or wages plus employer superannuation contributions under IRD rules.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>IRD KiwiSaver references</h2></div><div className={styles.sourceList}>{kiwiSaverSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.label}</strong><span>Official Inland Revenue guidance ↗</span></a>)}</div><p><Link className={styles.cta} href="/nz-paye-calculator">PAYE & Tax Calculator →</Link> <Link className={styles.cta} href="/minimum-wage">Minimum Wage NZ →</Link></p></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>KiwiSaver questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Financial information notice:</strong> This calculator is a general estimate, not financial, tax or retirement advice. Payroll treatment, eligibility, total-remuneration agreements, savings suspensions and individual circumstances can change the result. Inland Revenue remains the authoritative source.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
