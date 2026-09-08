import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import StudentLoanCalculator from './StudentLoanCalculator';
import {getStudentLoanSnapshot,studentLoanSources} from '@/lib/student-loan';

export const revalidate=604800;

export const metadata:Metadata={
  title:'NZ Student Loan Repayment Calculator 2026 | IRD Threshold & 12% Deductions',
  description:'Calculate New Zealand student loan deductions from weekly, fortnightly or monthly pay using the current IRD repayment threshold and 12% rate.',
  keywords:['student loan calculator NZ','NZ student loan repayment calculator','student loan repayment threshold NZ','student loan deductions NZ','IRD student loan calculator','12 percent student loan NZ'],
  alternates:{canonical:'/nz-student-loan-calculator'},
  openGraph:{title:'NZ Student Loan Repayment Calculator 2026 | Webfit News',description:'Estimate current student loan deductions from salary and wages using IRD rules.',url:'/nz-student-loan-calculator',type:'website'},
};

function formatChecked(value:string){return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(value));}

export default async function StudentLoanPage(){
  const snapshot=await getStudentLoanSnapshot();
  const faq=[
    {q:'What is the New Zealand student loan repayment rate?',a:'For New Zealand-based salary and wage earners, the standard repayment rate is 12% of income above the applicable repayment threshold for a main job.'},
    {q:'What is the current student loan repayment threshold?',a:'The annual repayment threshold is $24,128. Current pay-period thresholds include $464 weekly, $928 fortnightly, $1,856 every four weeks and $2,010.66 monthly.'},
    {q:'How are student loan deductions calculated for a secondary job?',a:'The normal repayment threshold does not apply to a secondary job because it is already used against the main job. Standard deductions are 12% of every dollar earned from the secondary job, unless IRD approves a special deduction rate.'},
    {q:'Can I make extra student loan repayments?',a:'Yes. Extra repayments can be made to pay the loan off faster. The calculator lets you model an extra amount per pay period.'},
    {q:'What happens when my student loan is nearly paid off?',a:'IRD says it may notify you and your employer when the balance is under $1,000 and the loan is expected to be cleared within the next three pay periods, so the final deduction can be adjusted.'},
  ];
  const ld={'@context':'https://schema.org','@graph':[
    {'@type':'WebApplication',name:'NZ Student Loan Repayment Calculator',url:'https://www.webfitnews.com/nz-student-loan-calculator',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
    {'@type':'FAQPage',mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://www.webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'Student Loan Calculator',item:'https://www.webfitnews.com/nz-student-loan-calculator'}]},
  ]};

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Money Guide</span><h1>NZ Student Loan Repayment Calculator</h1><p className={styles.lead}>Estimate how much should come out of your pay for a New Zealand student loan, compare main-job and secondary-job deductions, and model extra repayments.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>Official sources checked:</strong> {snapshot.sourcesChecked}/{snapshot.totalSources} · {formatChecked(snapshot.checkedAt)}</div></div><div className={styles.heroCard}><span>Current standard rule</span><strong>12% above the threshold</strong><small>Annual threshold: $24,128.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Calculator</span><h2>Work out your student loan deduction</h2><p>Enter gross pay for one pay period. Main-job calculations use the matching IRD threshold; secondary jobs normally use 12% of all gross pay.</p></div><StudentLoanCalculator/></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Current thresholds</span><h2>2027 tax-year pay-period thresholds</h2></div><div className={styles.infoGrid}>
      <article><h3>Weekly</h3><p><strong>$464</strong> repayment threshold.</p></article>
      <article><h3>Fortnightly</h3><p><strong>$928</strong> repayment threshold.</p></article>
      <article><h3>Every 3 weeks</h3><p><strong>$1,392</strong> repayment threshold.</p></article>
      <article><h3>Every 4 weeks</h3><p><strong>$1,856</strong> repayment threshold.</p></article>
      <article><h3>Monthly</h3><p><strong>$2,010.66</strong> repayment threshold.</p></article>
      <article><h3>Annual</h3><p><strong>$24,128</strong> repayment threshold.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>How it works</span><h2>Main job versus secondary job</h2></div><div className={styles.infoGrid}>
      <article><h3>Main job</h3><p>With a main-job SL tax code, deduct the applicable pay-period threshold from gross pay and apply 12% to the remainder.</p></article>
      <article><h3>Secondary job</h3><p>The threshold normally does not apply again. Standard student loan deductions are 12% of every dollar earned from the secondary job.</p></article>
      <article><h3>Special deduction rates</h3><p>If your main income is below the threshold, or deductions create hardship, IRD may approve a reduced or special deduction rate.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Extra repayments</span><h2>Paying the loan off faster</h2><p>Extra repayments are allowed. The payoff estimate above is deliberately simple: it assumes the same pay and extra repayment every period and does not attempt to predict future salary changes, overseas-borrower rules, interest, penalties or other IRD adjustments.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>IRD references</h2></div><div className={styles.sourceList}>{studentLoanSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.label}</strong><span>Official Inland Revenue guidance ↗</span></a>)}</div><p><Link className={styles.cta} href="/nz-paye-calculator">PAYE & tax calculator →</Link> <Link className={styles.cta} href="/nz-kiwisaver-calculator">KiwiSaver calculator →</Link></p></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ student loan repayment questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Money information notice:</strong> This is a general estimate for New Zealand-based salary and wage earners. Special deduction rates, exemptions, self-employed income, overseas borrower rules and individual IRD adjustments can change the amount actually payable.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
