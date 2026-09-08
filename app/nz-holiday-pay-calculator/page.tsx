import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import HolidayPayCalculator from './HolidayPayCalculator';
import styles from '@/components/UtilityGuide.module.css';

export const metadata:Metadata={
  title:'Holiday Pay Calculator NZ 2026 | Annual Leave & Public Holiday Pay',
  description:'Calculate NZ holiday pay using ordinary weekly pay vs average weekly earnings, plus public-holiday time-and-a-half. Current Holidays Act rules for 2026.',
  keywords:['holiday pay calculator NZ','annual leave pay calculator NZ','holiday pay NZ','annual leave pay NZ','public holiday pay NZ','time and a half NZ','8 percent holiday pay NZ'],
  alternates:{canonical:'/nz-holiday-pay-calculator'},
  openGraph:{title:'Holiday Pay Calculator NZ 2026 | Annual Leave & Public Holiday Pay',description:'Estimate annual-leave pay and public-holiday pay under current New Zealand Holidays Act rules.',url:'/nz-holiday-pay-calculator',type:'website'},
};
const sources=[
  ['Annual holiday pay','https://www.employment.govt.nz/pay-and-hours/pay-and-wages/leave-and-holiday-pay/annual-holiday-pay'],['Calculating holiday and leave pay','https://www.employment.govt.nz/pay-and-hours/pay-and-wages/leave-and-holiday-pay/calculating-holiday-and-leave-pay'],['Public holiday pay','https://www.employment.govt.nz/pay-and-hours/pay-and-wages/leave-and-holiday-pay/public-holiday-pay'],
] as const;

export default function HolidayPayPage(){
  const faq=[
    {q:'How do I calculate holiday pay in New Zealand?',a:'For annual holidays taken, pay is generally at least the greater of ordinary weekly pay at the start of the holiday or average weekly earnings over the relevant previous 12 months. The calculator compares those two weekly rates.'},
    {q:'What is average weekly earnings for NZ holiday pay?',a:'Average weekly earnings are generally gross earnings over the previous 12 months divided by 52. Special rules can apply for shorter employment or periods of unpaid leave.'},
    {q:'Is holiday pay always 8% in New Zealand?',a:'No. The 8% method applies only in specific situations, including lawful pay-as-you-go arrangements and part-year final-pay calculations. Employees generally become entitled to four weeks of paid annual holidays after 12 months.'},
    {q:'How much do I get paid for working on a public holiday?',a:'If you work on a public holiday, the Holidays Act generally requires at least the applicable time-and-a-half calculation for the time actually worked. Penal rates in an employment agreement can affect the comparison.'},
    {q:'Do I get a day in lieu for working on a public holiday?',a:'Usually yes when the public holiday is an otherwise working day for you. The legal term is an alternative holiday.'},
    {q:'Are NZ holiday pay rules changing?',a:'Yes. The Employment Leave Act is due to replace the Holidays Act in August 2028. Current Holidays Act rules continue to apply until then.'},
  ];
  const faqEntities=faq.map(item=>({'@type':'Question',name:item.q,acceptedAnswer:{'@type':'Answer',text:item.a}}));
  const ld={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebApplication',name:'Holiday Pay Calculator NZ',url:'https://webfitnews.com/nz-holiday-pay-calculator',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
      {'@type':'FAQPage',mainEntity:faqEntities},
      {'@type':'BreadcrumbList',itemListElement:[
        {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
        {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
        {'@type':'ListItem',position:3,name:'Holiday Pay Calculator NZ',item:'https://webfitnews.com/nz-holiday-pay-calculator'},
      ]},
    ],
  };

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Holiday Pay Tool</span><h1>Holiday Pay Calculator NZ 2026</h1><p className={styles.lead}>Calculate annual-leave pay using the greater of ordinary weekly pay and average weekly earnings, or estimate pay for working a New Zealand public holiday.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>Current law:</strong> Holidays Act rules remain in force until the Employment Leave Act takes effect in August 2028.</div></div><div className={styles.heroCard}><span>Annual leave rule</span><strong>Higher of OWP or AWE</strong><small>Public-holiday work is generally at least time-and-a-half, with an alternative holiday when applicable.</small></div></section>

    <HolidayPayCalculator/>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Quick answer</span><h2>How annual leave pay is calculated in NZ</h2><p>When annual holidays are taken, the minimum payment is generally the greater of <strong>ordinary weekly pay (OWP)</strong> at the start of the holiday or <strong>average weekly earnings (AWE)</strong> over the relevant previous 12 months.</p></div><div className={styles.infoGrid}>
      <article><h3>Ordinary weekly pay</h3><p>What you normally receive for an ordinary working week, including regular payments that form part of normal weekly earnings.</p></article>
      <article><h3>Average weekly earnings</h3><p>Generally gross earnings over the previous 12 months divided by 52. The higher of AWE and OWP is used for annual holiday pay.</p></article>
      <article><h3>Minimum entitlement</h3><p>Employees generally become entitled to four weeks of paid annual holidays after 12 months of continuous employment.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>8% holiday pay</span><h2>Is NZ holiday pay always 8%?</h2><p>No. The common “8% holiday pay” rule is not the normal calculation for taking entitled annual leave. Employment New Zealand permits 8% pay-as-you-go only in specified situations, and 8% also appears in certain final-pay calculations for a part-year since the last anniversary.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Public holiday pay</span><h2>How much are you paid for working a public holiday?</h2><p>For public-holiday work, the legal calculation is generally at least the greater of the applicable time-and-a-half calculation or the employee’s relevant/average daily pay for the time actually worked including any applicable penal rates.</p></div><div className={styles.infoGrid}>
      <article><h3>At least time-and-a-half</h3><p>For common hourly-rate situations, this is often described as at least 1.5 times the relevant rate for the hours actually worked.</p></article>
      <article><h3>Alternative holiday</h3><p>If the public holiday is an otherwise working day, you usually receive a paid alternative holiday as well.</p></article>
      <article><h3>If you do not work</h3><p>If it is an otherwise working day and you do not work, you are generally entitled to the paid public holiday at RDP or ADP as applicable.</p><Link className={styles.cta} href="/public-holidays">Check NZ public holiday dates →</Link></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Employment New Zealand holiday pay guidance</h2></div><div className={styles.sourceList}>{sources.map(([name,url])=><a key={url} href={url} target="_blank" rel="noopener noreferrer"><div><strong>{name}</strong><small>Employment New Zealand</small></div><span>Open official page ↗</span></a>)}</div><p><Link className={styles.cta} href="/nz-leave-entitlement-calculator">Check annual leave and sick leave entitlement →</Link></p></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>Holiday pay calculator NZ questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Calculator notice:</strong> This is an estimate for common situations, not payroll, legal or employment advice. Holiday-pay calculations can be more complex where hours, commissions, bonuses, allowances, penal rates, unpaid leave, shifts or work patterns vary.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
