import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import LeaveEntitlementCalculator from './LeaveEntitlementCalculator';
import { getLeaveSourceSnapshot, leaveSources, LEAVE_SOURCE_REVALIDATE_SECONDS } from '@/lib/leave-entitlements';

export const revalidate=LEAVE_SOURCE_REVALIDATE_SECONDS;

export const metadata:Metadata={
  title:'NZ Sick Leave & Annual Leave Entitlement Calculator 2026',
  description:'Check New Zealand sick leave eligibility, carried sick leave and annual holiday entitlement under current Employment New Zealand rules.',
  keywords:['sick leave NZ','sick leave calculator NZ','annual leave calculator NZ','annual leave entitlement NZ','leave entitlement NZ','10 days sick leave NZ','4 weeks annual leave NZ'],
  alternates:{canonical:'/nz-leave-entitlement-calculator'},
  openGraph:{title:'NZ Sick Leave & Annual Leave Entitlement Calculator | Webfit News',description:'Estimate current New Zealand sick leave and annual holiday entitlements with official Employment New Zealand sources.',url:'/nz-leave-entitlement-calculator',type:'website'},
};

function formatChecked(value:string){return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(value));}

export default async function LeaveEntitlementPage(){
  const snapshot=await getLeaveSourceSnapshot();
  const faq=[
    {q:'How much sick leave do employees get in New Zealand?',a:'Eligible employees get at least 10 days of paid sick leave each year. Eligibility generally begins after 6 months of continuous employment, or after meeting the alternative six-month hours test.'},
    {q:'Can unused sick leave carry over?',a:'Yes. Unused sick leave carries over, with the statutory balance generally capped at 20 days unless the employment agreement or workplace policy provides more.'},
    {q:'Do part-time workers get fewer than 10 sick days?',a:'No. Eligible part-time and casual employees also receive the statutory 10 days. Sick leave is not pro-rated simply because someone works fewer days each week.'},
    {q:'How much annual leave do employees get in New Zealand?',a:'After 12 months of continuous employment, employees become entitled to at least 4 weeks of paid annual holidays. The legal entitlement is measured in weeks, not as a fixed number of days accrued each month.'},
    {q:'Are the leave rules changing?',a:'Yes. The Employment Leave Act is scheduled to replace the Holidays Act from August 2028. Until then, the current Holidays Act rules continue to apply.'},
  ];
  const ld={'@context':'https://schema.org','@graph':[
    {'@type':'WebApplication',name:'NZ Sick Leave & Annual Leave Entitlement Calculator',url:'https://www.webfitnews.com/nz-leave-entitlement-calculator',applicationCategory:'BusinessApplication',operatingSystem:'Web',description:metadata.description},
    {'@type':'FAQPage',mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://www.webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'Leave Entitlement Calculator',item:'https://www.webfitnews.com/nz-leave-entitlement-calculator'}]},
  ]};

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Employment Guide</span><h1>NZ Sick Leave & Annual Leave Entitlement Calculator</h1><p className={styles.lead}>Check the current minimum sick leave and annual holiday entitlements, without confusing payroll accrual displays with what New Zealand employment law actually provides.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>Official sources checked:</strong> {snapshot.sourcesChecked}/{snapshot.totalSources} · {formatChecked(snapshot.checkedAt)}</div></div><div className={styles.heroCard}><span>Current minimums</span><strong>10 sick days · 4 weeks annual holidays</strong><small>Eligibility timing and work-pattern rules still matter.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Calculator</span><h2>Check your leave entitlement</h2><p>This estimates statutory minimum entitlements only. Better terms in an employment agreement still apply.</p></div><LeaveEntitlementCalculator/></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Sick leave</span><h2>How sick leave works in New Zealand</h2></div><div className={styles.infoGrid}>
      <article><h3>10 days after qualifying</h3><p>Eligible employees receive 10 days of paid sick leave each year after 6 months of continuous employment, or once the alternative six-month hours test is met.</p></article>
      <article><h3>The hours test</h3><p>The alternative test is an average of at least 10 hours per week over 6 months, including at least 1 hour every week or 40 hours every month.</p></article>
      <article><h3>Carry-over up to 20 days</h3><p>Unused sick leave carries into the next entitlement year. The statutory balance can accumulate to 20 days, unless the employer provides a more generous entitlement.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Annual holidays</span><h2>Four weeks means four weeks</h2><p>After 12 months of continuous employment, employees become entitled to at least four weeks of paid annual holidays. The Holidays Act does not create a simple statutory “days accrued each month” formula. For a stable five-day work week, four weeks commonly corresponds to 20 working days; variable work patterns need a genuine-week assessment.</p></div><div className={styles.infoGrid}>
      <article><h3>Before 12 months</h3><p>An employee generally has not yet become entitled to the statutory four weeks, although an employer and employee can agree to annual holidays in advance.</p></article>
      <article><h3>Payroll balances can mislead</h3><p>A payslip may show an accrued balance, but Employment New Zealand warns that payroll accruals can produce the wrong legal entitlement when working patterns change.</p></article>
      <article><h3>Better terms still count</h3><p>An employment agreement can provide more than the legal minimum. The calculator does not reduce any contractual entitlement that is more generous.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Law change</span><h2>Leave rules change in August 2028</h2><p>The new Employment Leave Act is scheduled to replace the Holidays Act in August 2028. Until then, employers and employees must continue to use the current Holidays Act rules shown here.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Employment New Zealand references</h2></div><div className={styles.sourceList}>{leaveSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.label}</strong><span>Official Employment New Zealand guidance ↗</span></a>)}</div><p><Link className={styles.cta} href="/nz-holiday-pay-calculator">Holiday pay calculator →</Link> <Link className={styles.cta} href="/minimum-wage">Minimum Wage NZ →</Link></p></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ leave entitlement questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Employment information notice:</strong> This calculator is a general guide, not legal or payroll advice. Employment agreements, variable work patterns, closedowns, final pay and individual circumstances can change the result. Employment New Zealand remains the authoritative source.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
