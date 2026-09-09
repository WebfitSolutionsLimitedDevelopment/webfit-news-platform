import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import KiwiSaverCalculator from './KiwiSaverCalculator';
import {getKiwiSaverSnapshot,kiwiSaverSources} from '@/lib/kiwisaver';

export const revalidate=604800;

export const metadata:Metadata={
  title:'KiwiSaver Calculator NZ 2026 | Contributions, ESCT & Government Top-Up',
  description:'Use our 2026 KiwiSaver calculator to estimate employee and employer contributions, ESCT, government contribution and total annual KiwiSaver savings from salary.',
  keywords:['KiwiSaver calculator NZ','NZ KiwiSaver calculator','KiwiSaver employer contribution','KiwiSaver contribution rates 2026','ESCT calculator','KiwiSaver government contribution'],
  alternates:{canonical:'/nz-kiwisaver-calculator'},
  openGraph:{title:'KiwiSaver Calculator NZ 2026 | Contributions & ESCT',description:'Estimate employee contributions, employer contributions after ESCT and the current government KiwiSaver contribution.',url:'/nz-kiwisaver-calculator',type:'website'},
};

function formatChecked(value:string){return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(value));}

export default async function KiwiSaverPage(){
  const snapshot=await getKiwiSaverSnapshot();
  const faq=[
    {q:'How much will I contribute to KiwiSaver in 2026?',a:'Your employee contribution is based on your gross salary or wages and chosen contribution rate. The current default employee rate is 3.5%, with standard choices of 3.5%, 4%, 6%, 8% and 10%.'},
    {q:'What is the default KiwiSaver contribution rate in 2026?',a:'From 1 April 2026, the default employee and matching employer KiwiSaver contribution rate is 3.5%. The default is scheduled to rise to 4% from 1 April 2028.'},
    {q:'Can I still contribute 3%?',a:'A temporary rate reduction can allow an employee to contribute 3% for between 3 and 12 months. An employer may choose to match that temporary 3% rate.'},
    {q:'What employee KiwiSaver rates can I choose?',a:'The standard employee contribution rates are 3.5%, 4%, 6%, 8% and 10% of gross pay. A temporary 3% reduction may apply if approved.'},
    {q:'How much does my employer put into KiwiSaver?',a:'The compulsory employer contribution is generally at least 3.5% for eligible employees from 1 April 2026, but ESCT is usually deducted before the net employer amount reaches your KiwiSaver account.'},
    {q:'What is ESCT on KiwiSaver?',a:'ESCT is employer superannuation contribution tax. It is generally deducted from employer KiwiSaver contributions before the remaining amount reaches the employee’s KiwiSaver account.'},
    {q:'How much is the current government KiwiSaver contribution?',a:'From 1 July 2025 the government contributes 25 cents for each eligible dollar contributed, up to a maximum of $260.72 a year. People with taxable income above $180,000 do not qualify.'},
  ];
  const ld={'@context':'https://schema.org','@graph':[
    {'@type':'WebApplication',name:'KiwiSaver Calculator NZ 2026',url:'https://webfitnews.com/nz-kiwisaver-calculator',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
    {'@type':'FAQPage',mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'KiwiSaver Calculator NZ',item:'https://webfitnews.com/nz-kiwisaver-calculator'}]},
  ]};

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand KiwiSaver Calculator 2026</span><h1>KiwiSaver Calculator NZ 2026</h1><p className={styles.lead}>Estimate your employee contribution, employer contribution after ESCT, current government contribution and total annual KiwiSaver amount using 2026 settings.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>IRD sources checked:</strong> {snapshot.sourcesChecked}/{snapshot.totalSources} · {formatChecked(snapshot.checkedAt)}</div></div><div className={styles.heroCard}><span>Current default</span><strong>3.5% employee + 3.5% employer</strong><small>Default rises to 4% from 1 April 2028.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Quick answer</span><h2>KiwiSaver contribution rates 2026 at a glance</h2><p>The default employee contribution is <strong>3.5%</strong> and the matching employer minimum is generally <strong>3.5%</strong> for eligible employees. Employer contributions are usually reduced by <strong>ESCT</strong> before reaching your account. The current government contribution can be up to <strong>$260.72 a year</strong> if you qualify.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Calculator</span><h2>Calculate your KiwiSaver contributions</h2><p>Enter your gross salary and contribution rates to estimate your employee amount, gross employer contribution, ESCT, net employer contribution and eligible government contribution.</p></div><KiwiSaverCalculator/></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>2026 settings</span><h2>Current KiwiSaver contribution rules</h2></div><div className={styles.infoGrid}>
      <article><h3>Employee contribution rates</h3><p>The current default is 3.5%. Employees can choose 4%, 6%, 8% or 10%. A temporary reduction to 3% can apply for 3 to 12 months.</p></article>
      <article><h3>Employer contribution</h3><p>From 1 April 2026, the compulsory employer contribution is generally 3.5% of gross salary or wages for eligible employees, subject to KiwiSaver rules and ESCT.</p></article>
      <article><h3>Government contribution</h3><p>The government currently contributes 25 cents per eligible dollar contributed, capped at $260.72 a year. Taxable income above $180,000 removes eligibility.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>ESCT</span><h2>KiwiSaver employer contribution after ESCT</h2><p>Employer contributions are generally taxed using ESCT. Current thresholds are 10.5% up to $18,720, 17.5% to $64,200, 30% to $93,720, 33% to $216,000 and 39% above that. The applicable threshold is based on salary or wages plus employer superannuation contributions under IRD rules.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Related calculators</span><h2>More NZ salary and tax tools</h2></div><div className={styles.infoGrid}><article><h3>PAYE Calculator NZ</h3><p>Estimate take-home pay after income tax, ACC, KiwiSaver and student-loan deductions.</p><Link href="/nz-paye-calculator">Calculate NZ take-home pay →</Link></article><article><h3>NZ Tax Code Finder</h3><p>Find the likely IRD tax code for your main or secondary income.</p><Link href="/nz-tax-code-finder">Find your tax code →</Link></article><article><h3>Student Loan Calculator</h3><p>Estimate student-loan deductions by pay period.</p><Link href="/nz-student-loan-calculator">Calculate student-loan repayments →</Link></article></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>IRD KiwiSaver references</h2></div><div className={styles.sourceList}>{kiwiSaverSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.label}</strong><span>Official Inland Revenue guidance ↗</span></a>)}</div></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>KiwiSaver calculator NZ: common questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Financial information notice:</strong> This calculator is a general estimate, not financial, tax or retirement advice. Payroll treatment, eligibility, total-remuneration agreements, savings suspensions and individual circumstances can change the result. Inland Revenue remains the authoritative source.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
