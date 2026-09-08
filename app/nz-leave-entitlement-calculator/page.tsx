import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import LeaveEntitlementCalculator from './LeaveEntitlementCalculator';
import { getLeaveSourceSnapshot, leaveSources } from '@/lib/leave-entitlements';

export const revalidate=86400;
export const metadata:Metadata={
  title:'Sick Leave NZ 2026 | 10-Day Rule & Annual Leave Calculator',
  description:'Check NZ sick leave eligibility, the 10-day entitlement, 20-day carry-over limit and annual leave entitlement. Includes a current New Zealand leave calculator.',
  keywords:['sick leave NZ','sick leave calculator NZ','10 days sick leave NZ','annual leave calculator NZ','annual leave entitlement NZ','4 weeks annual leave NZ','sick leave entitlement NZ'],
  alternates:{canonical:'/nz-leave-entitlement-calculator'},
  openGraph:{title:'Sick Leave NZ 2026 | 10-Day Rule & Annual Leave Calculator',description:'Check New Zealand sick leave and annual leave entitlements under current Employment NZ rules.',url:'/nz-leave-entitlement-calculator',type:'website'},
};
function formatChecked(value:string){return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(value));}

export default async function LeaveEntitlementPage(){
  const snapshot=await getLeaveSourceSnapshot();
  const faq=[
    {q:'How many sick days do you get in NZ?',a:'Eligible employees get at least 10 days of paid sick leave each year. This applies to qualifying full-time, part-time and casual employees and is not simply pro-rated because someone works fewer days each week.'},
    {q:'When do I become entitled to sick leave in New Zealand?',a:'You generally qualify after 6 months of continuous employment, or after working for the same employer over a 6-month period for an average of at least 10 hours a week and at least 1 hour every week or 40 hours every month.'},
    {q:'How much sick leave can I carry over?',a:'Unused statutory sick leave carries over up to a maximum balance of 20 days, unless your employment agreement or workplace policy provides a more generous entitlement.'},
    {q:'Do part-time employees get 10 sick days in NZ?',a:'Yes. Employment New Zealand explicitly says statutory sick leave is not pro-rated. An eligible part-time employee receives 10 days a year.'},
    {q:'How much annual leave do employees get in NZ?',a:'After 12 months of continuous employment, employees become entitled to at least 4 weeks of paid annual holidays. For a regular three-day work week, four weeks would normally be 12 working days; for a regular five-day week, 20 working days.'},
    {q:'Can I cash out sick leave when I leave my job?',a:'Unused statutory sick leave is generally not cashed up or included in final pay when employment ends.'},
  ];
  const faqEntities=faq.map(item=>({'@type':'Question',name:item.q,acceptedAnswer:{'@type':'Answer',text:item.a}}));
  const ld={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebApplication',name:'NZ Sick Leave & Annual Leave Calculator',url:'https://webfitnews.com/nz-leave-entitlement-calculator',applicationCategory:'BusinessApplication',operatingSystem:'Web',description:metadata.description},
      {'@type':'FAQPage',mainEntity:faqEntities},
      {'@type':'BreadcrumbList',itemListElement:[
        {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
        {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
        {'@type':'ListItem',position:3,name:'Sick Leave NZ & Annual Leave Calculator',item:'https://webfitnews.com/nz-leave-entitlement-calculator'},
      ]},
    ],
  };

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Leave Entitlement Tool</span><h1>Sick Leave NZ 2026 & Annual Leave Calculator</h1><p className={styles.lead}>Check whether you qualify for New Zealand’s 10 days of paid sick leave, how carry-over works, and your minimum four-week annual holiday entitlement.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>Employment NZ sources checked:</strong> {snapshot.sourcesChecked}/{snapshot.totalSources} · {formatChecked(snapshot.checkedAt)}</div></div><div className={styles.heroCard}><span>Current statutory minimums</span><strong>10 sick days · 4 weeks annual leave</strong><small>Sick leave can generally accumulate to a 20-day statutory balance.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Leave calculator</span><h2>Check your sick leave and annual leave entitlement</h2><p>Enter your service and work pattern for an indicative statutory-minimum result. More generous employment-agreement terms still apply.</p></div><LeaveEntitlementCalculator/></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Quick answer</span><h2>How sick leave works in New Zealand</h2></div><div className={styles.infoGrid}>
      <article><h3>10 paid sick days</h3><p>Once eligible, full-time, part-time and casual employees receive at least 10 days of paid sick leave each year.</p></article>
      <article><h3>Qualify after 6 months</h3><p>Eligibility generally starts after six months continuously with the employer, or after meeting the alternative six-month hours test.</p></article>
      <article><h3>Carry over to 20 days</h3><p>Unused statutory sick leave carries forward, with the statutory balance generally capped at 20 days unless better terms apply.</p></article>
      <article><h3>Not pro-rated</h3><p>An eligible employee working three days a week still gets 10 sick days a year; Employment New Zealand says the entitlement is not pro-rated.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Sick leave hours test</span><h2>What is the alternative 6-month work test?</h2><p>Over a six-month period with the same employer, you need to average at least <strong>10 hours a week</strong> and work at least <strong>1 hour in every week or 40 hours in every month</strong>. Meeting that test can qualify an employee who does not fit the straightforward continuous-employment route.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Annual leave NZ</span><h2>Four weeks of annual holidays after 12 months</h2><p>After each 12 months of continuous employment, employees become entitled to at least four weeks of paid annual holidays. The legal entitlement is based on a genuine working week rather than a universal fixed number of days.</p></div><div className={styles.infoGrid}>
      <article><h3>5-day regular week</h3><p>Four working weeks commonly corresponds to 20 working days when the employee consistently works five days each week.</p></article>
      <article><h3>3-day regular week</h3><p>Employment New Zealand gives the example that an employee consistently working three days a week has 12 days across four working weeks.</p></article>
      <article><h3>Variable work patterns</h3><p>Where a working week is not clear, employer and employee need a fair and reasonable method to define the four-week entitlement.</p></article>
      <article><h3>Payroll accrual is not the law</h3><p>A payroll system may display leave accruing each pay period, but the current Holidays Act entitlement itself arises in weeks after 12 months.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Current law</span><h2>NZ leave rules change in August 2028</h2><p>The Employment Leave Act is scheduled to replace the Holidays Act in August 2028. Until then, the current sick-leave and annual-holiday rules on this page continue to apply.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Employment New Zealand sick and annual leave guidance</h2></div><div className={styles.sourceList}>{leaveSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.label}</strong><span>Official Employment New Zealand guidance ↗</span></a>)}</div><p><Link className={styles.cta} href="/nz-holiday-pay-calculator">Calculate annual leave and public holiday pay →</Link> <Link className={styles.cta} href="/minimum-wage">Check the NZ minimum wage →</Link></p></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>Sick leave NZ and annual leave questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Employment information notice:</strong> This calculator is a general guide, not legal or payroll advice. Employment agreements, variable work patterns, closedowns, final pay and individual circumstances can change the result.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
