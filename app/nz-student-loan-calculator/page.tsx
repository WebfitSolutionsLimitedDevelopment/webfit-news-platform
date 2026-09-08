import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import StudentLoanCalculator from './StudentLoanCalculator';
import {getStudentLoanSnapshot,studentLoanSources} from '@/lib/student-loan';

export const revalidate=604800;

export const metadata:Metadata={
  title:'NZ Student Loan Calculator 2026/27 | Repayment Threshold & 12% Rate',
  description:'Calculate NZ student loan repayments from weekly, fortnightly or monthly pay. Current 2026/27 threshold is $24,128 and the standard repayment rate is 12%.',
  keywords:['student loan calculator NZ','NZ student loan calculator','student loan repayment calculator NZ','student loan repayment threshold NZ','student loan deductions NZ','IRD student loan calculator'],
  alternates:{canonical:'/nz-student-loan-calculator'},
  openGraph:{title:'NZ Student Loan Calculator 2026/27 | Threshold & 12% Rate',description:'Estimate student loan deductions from New Zealand salary and wages using the current repayment threshold and rate.',url:'/nz-student-loan-calculator',type:'website'},
};

function formatChecked(value:string){return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(value));}

export default async function StudentLoanPage(){
  const snapshot=await getStudentLoanSnapshot();
  const faq=[
    {q:'What is the NZ student loan repayment threshold in 2026/27?',a:'The current annual repayment threshold from 1 April 2026 is $24,128. Pay-period thresholds include $464 weekly, $928 fortnightly, $1,856 every four weeks and $2,010.66 monthly.'},
    {q:'What is the New Zealand student loan repayment rate?',a:'For a New Zealand-based borrower earning salary or wages, the standard repayment rate is 12 cents for each dollar above the applicable repayment threshold for main income.'},
    {q:'How much student loan comes out of $1,000 weekly pay?',a:'Using the standard weekly threshold of $464, the amount above the threshold is $536. At 12%, the indicative student-loan deduction is $64.32 for that pay period, before any special rate or adjustment.'},
    {q:'How are student loan deductions calculated for a second job?',a:'The normal threshold does not generally apply again to secondary salary or wages. Standard student-loan deductions are usually 12% of the secondary gross pay unless an IRD special deduction rate or exemption applies.'},
    {q:'Can I make extra student loan repayments?',a:'Yes. IRD allows additional repayments, and its official repayment calculator can show how extra payments may shorten the payoff time.'},
    {q:'Is this the official IRD student loan calculator?',a:'No. This Webfit News tool estimates common salary-and-wage deductions. Inland Revenue also provides an official calculator for repayment obligations, payoff time and extra repayments.'},
  ];
  const faqEntities=faq.map(item=>({
    '@type':'Question',
    name:item.q,
    acceptedAnswer:{'@type':'Answer',text:item.a},
  }));
  const ld={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebApplication',name:'NZ Student Loan Calculator',url:'https://webfitnews.com/nz-student-loan-calculator',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
      {'@type':'FAQPage',mainEntity:faqEntities},
      {'@type':'BreadcrumbList',itemListElement:[
        {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
        {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
        {'@type':'ListItem',position:3,name:'NZ Student Loan Calculator',item:'https://webfitnews.com/nz-student-loan-calculator'},
      ]},
    ],
  };

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Student Loan Tool</span><h1>NZ Student Loan Calculator 2026/27</h1><p className={styles.lead}>Calculate the student-loan deduction from your pay using the current New Zealand repayment threshold and standard 12% rate, with separate handling for main and secondary jobs.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>Official sources checked:</strong> {snapshot.sourcesChecked}/{snapshot.totalSources} · {formatChecked(snapshot.checkedAt)}</div></div><div className={styles.heroCard}><span>Current NZ-based borrower rule</span><strong>12% over $24,128</strong><small>Annual threshold effective from 1 April 2026.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Student loan calculator</span><h2>Calculate your repayment from each pay</h2><p>Choose your pay frequency and enter gross pay. For a main job the calculator applies the matching threshold; secondary salary or wages normally use 12% of gross pay.</p></div><StudentLoanCalculator/></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Quick answer</span><h2>NZ student loan repayment threshold 2026/27</h2></div><div className={styles.infoGrid}>
      <article><h3>Weekly</h3><p><strong>$464</strong> repayment threshold.</p></article>
      <article><h3>Fortnightly</h3><p><strong>$928</strong> repayment threshold.</p></article>
      <article><h3>Every 3 weeks</h3><p><strong>$1,392</strong> repayment threshold.</p></article>
      <article><h3>Every 4 weeks</h3><p><strong>$1,856</strong> repayment threshold.</p></article>
      <article><h3>Monthly</h3><p><strong>$2,010.66</strong> repayment threshold.</p></article>
      <article><h3>Annual</h3><p><strong>$24,128</strong> repayment threshold.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Worked example</span><h2>Student loan deduction on $1,000 weekly pay</h2><p>For a standard main job, $1,000 gross weekly pay minus the $464 weekly threshold leaves $536. Applying 12% gives an indicative student-loan deduction of <strong>$64.32</strong> for that week.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Main vs second job</span><h2>How student loan deductions work from salary and wages</h2></div><div className={styles.infoGrid}>
      <article><h3>Main job</h3><p>With an SL main-income tax code, the applicable pay-period threshold is deducted from gross pay and the standard 12% rate applies to the remainder.</p></article>
      <article><h3>Secondary job</h3><p>The threshold normally does not apply a second time. Standard student-loan deductions are generally 12% of the secondary gross salary or wages.</p></article>
      <article><h3>Special rates or exemptions</h3><p>IRD can approve special deduction rates or repayment deduction exemptions in qualifying circumstances, so the standard calculation is not universal.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Pay it faster</span><h2>Extra student loan repayments</h2><p>You can make additional repayments. The payoff estimate in this tool assumes the same pay and extra repayment each period and does not predict salary changes, overseas-borrower interest, penalties or future IRD adjustments.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official IRD sources</span><h2>Check your student loan with Inland Revenue</h2></div><div className={styles.sourceList}>{studentLoanSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.label}</strong><span>Official Inland Revenue guidance ↗</span></a>)}</div><p><a className={styles.cta} href="https://www.ird.govt.nz/student-loans/tracking-my-student-loan-balance/student-loan-repayment-calculator" target="_blank" rel="noopener noreferrer">Open the official IRD student loan repayment calculator ↗</a></p><p><Link className={styles.cta} href="/nz-paye-calculator">Calculate PAYE and take-home pay →</Link> <Link className={styles.cta} href="/nz-tax-code-finder">Find your NZ tax code →</Link></p></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ student loan calculator questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Money information notice:</strong> This is a general estimate for New Zealand-based salary and wage earners. Special deduction rates, exemptions, self-employed income, overseas-borrower rules and individual IRD adjustments can change the amount actually payable.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
