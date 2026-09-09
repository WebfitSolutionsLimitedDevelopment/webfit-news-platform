import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import {getNzTaxSnapshot,nzTaxSources} from '@/lib/nz-tax';
import {NzPayeCalculator} from './NzPayeCalculator';
import styles from '@/components/UtilityGuide.module.css';

export const revalidate=604800;

export const metadata:Metadata={
  title:'PAYE Calculator NZ 2026 | Salary, Tax & Take-Home Pay',
  description:'Calculate NZ take-home pay for 2026 from salary or wages, including income tax, ACC, KiwiSaver and student loan deductions using current IRD settings.',
  alternates:{canonical:'/nz-paye-calculator'},
  robots:{index:true,follow:true},
  openGraph:{title:'PAYE Calculator NZ 2026 | Salary, Tax & Take-Home Pay',description:'Calculate New Zealand take-home pay after income tax, ACC, KiwiSaver and student loan deductions.',url:'/nz-paye-calculator',type:'website'},
  twitter:{card:'summary_large_image',title:'PAYE Calculator NZ 2026 | Salary, Tax & Take-Home Pay',description:'Calculate New Zealand take-home pay after tax, ACC, KiwiSaver and student loan deductions.'},
};

const formatNz=(value:string)=>new Intl.DateTimeFormat('en-NZ',{day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Pacific/Auckland',timeZoneName:'short'}).format(new Date(value));

export default async function Page(){
  const s=await getNzTaxSnapshot();
  const faq=[
    {q:'How much PAYE will I pay in New Zealand?',a:'PAYE depends on your taxable income and tax code. This calculator estimates annual income tax using the current individual tax bands, then includes ACC and optional KiwiSaver and student-loan deductions to estimate take-home pay.'},
    {q:'What are the New Zealand income tax rates in 2026?',a:'For income from 1 April 2025 onward, individual tax rates are 10.5% to $15,600, 17.5% from $15,601 to $53,500, 30% from $53,501 to $78,100, 33% from $78,101 to $180,000, and 39% above $180,000.'},
    {q:'What is the ACC earners levy for 2026–27?',a:'For 1 April 2026 to 31 March 2027 the ACC earners levy is 1.75%, charged on earnings up to $156,641.'},
    {q:'What is the default KiwiSaver rate in 2026?',a:'From 1 April 2026 the default employee and matching employer KiwiSaver contribution rate is 3.5%. Employees can choose higher standard rates, while an approved temporary rate reduction can allow 3%.'},
    {q:'How are New Zealand student loan repayments calculated?',a:'For New Zealand-based salary and wage borrowers, repayments are generally 12% of earnings above the repayment threshold. The annual threshold is $24,128.'},
    {q:'Is this the same as the official IRD PAYE calculator?',a:'No. Webfit News provides a general salary and take-home estimate. Exact payroll PAYE depends on tax code, pay period and individual circumstances, so use the official IRD PAYE calculator for payroll-exact deductions.'},
  ];
  const ld={'@context':'https://schema.org','@graph':[
    {'@type':'WebPage',name:'PAYE Calculator NZ 2026',url:'https://webfitnews.com/nz-paye-calculator',description:metadata.description,dateModified:s.checkedAt,isPartOf:{'@type':'WebSite',name:'Webfit News',url:'https://webfitnews.com'}},
    {'@type':'WebApplication',name:'PAYE Calculator NZ 2026',url:'https://webfitnews.com/nz-paye-calculator',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
    {'@type':'FAQPage',mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'PAYE Calculator NZ',item:'https://webfitnews.com/nz-paye-calculator'}]},
  ]};

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand PAYE & Salary Calculator</span><h1>PAYE Calculator NZ 2026</h1><p className={styles.lead}>Enter your annual salary to estimate New Zealand income tax, ACC, KiwiSaver, student-loan deductions and take-home pay using current Inland Revenue settings.</p><div className={styles.freshness}><span className={s.sourceOk?styles.liveDot:styles.fallbackDot}/><strong>Official IRD sources checked:</strong> {formatNz(s.checkedAt)} · {s.sourcesChecked}/{s.totalSources} reachable</div></div><div className={styles.heroCard}><span>Current tax year</span><strong>{s.taxYear}</strong><small>ACC levy {s.accRate}% up to NZD ${s.accMaxEarnings.toLocaleString('en-NZ')}.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Quick answer</span><h2>Calculate your NZ salary after tax</h2><p>This calculator estimates your take-home pay after progressive income tax and the ACC Earners’ levy, with optional KiwiSaver and student-loan deductions. For exact payroll withholding by pay period and tax code, use Inland Revenue’s official PAYE calculator.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Calculator</span><h2>NZ PAYE and take-home pay calculator</h2><p>Enter an annual gross salary, choose how you want the result displayed, and optionally include KiwiSaver and student-loan deductions.</p></div><NzPayeCalculator/></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>2026 tax bands</span><h2>New Zealand individual income tax rates</h2></div><div className={styles.tableWrap}><table><thead><tr><th>Taxable income</th><th>Rate</th></tr></thead><tbody><tr><td>$0–$15,600</td><td>10.5%</td></tr><tr><td>$15,601–$53,500</td><td>17.5%</td></tr><tr><td>$53,501–$78,100</td><td>30%</td></tr><tr><td>$78,101–$180,000</td><td>33%</td></tr><tr><td>$180,001+</td><td>39%</td></tr></tbody></table></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Other deductions</span><h2>ACC, KiwiSaver and student loans</h2></div><div className={styles.cardGrid}><article className={styles.card}><h3>ACC earners’ levy</h3><p>{s.accRate}% on liable earnings up to NZD ${s.accMaxEarnings.toLocaleString('en-NZ')} for the 2026–27 tax year.</p></article><article className={styles.card}><h3>KiwiSaver</h3><p>The default employee contribution rate is {s.kiwiSaverDefault}%. Standard higher choices are 4%, 6%, 8% or 10%.</p></article><article className={styles.card}><h3>Student loan</h3><p>For a standard New Zealand-based salary/wage estimate, repayments are generally {s.studentLoanRate}% above the NZD ${s.studentLoanThreshold.toLocaleString('en-NZ')} annual threshold.</p></article></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Exact PAYE</span><h2>When to use Inland Revenue’s PAYE calculator</h2><p>Webfit News gives a useful annual salary estimate. Exact PAYE can differ because payroll deductions depend on tax code, pay frequency, tailored rates, secondary income, special student-loan settings, bonuses and other circumstances.</p><a className={styles.cta} href="https://www.ird.govt.nz/paye-calculator" target="_blank" rel="noopener noreferrer">Open official IRD PAYE calculator ↗</a></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Related guides</span><h2>More New Zealand tax and pay tools</h2></div><div className={styles.infoGrid}><article><h3>Minimum Wage NZ</h3><p>Check the current adult, starting-out and training minimum wage rates.</p><Link className={styles.cta} href="/minimum-wage">Check NZ minimum wage →</Link></article><article><h3>NZ Tax Code Finder</h3><p>Find the likely IRD tax code for main and secondary income.</p><Link className={styles.cta} href="/nz-tax-code-finder">Find your NZ tax code →</Link></article><article><h3>NZ KiwiSaver Calculator</h3><p>Estimate employee and employer contributions, ESCT and the government contribution.</p><Link className={styles.cta} href="/nz-kiwisaver-calculator">Calculate KiwiSaver contributions →</Link></article><article><h3>NZ Rates Rebate Calculator</h3><p>Estimate a 2026/27 council rates rebate using current thresholds and the statutory maximum.</p><Link className={styles.cta} href="/nz-rates-rebate-calculator">Check your rates rebate →</Link></article></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Inland Revenue sources used</h2></div><div className={styles.sourceList}>{nzTaxSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><div><strong>{source.name}</strong><small>Official Inland Revenue source</small></div><span>Open official page ↗</span></a>)}</div></section>

    <section className={styles.section} id="faq"><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>PAYE calculator NZ: common questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Calculator notice:</strong> This is a general estimate, not tax or financial advice. It does not reproduce Inland Revenue payroll tables or account for every tax code, credit, deduction or personal circumstance. For payroll-exact PAYE, use Inland Revenue’s official calculator.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
