import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import HolidayPayCalculator from './HolidayPayCalculator';
import styles from '@/components/UtilityGuide.module.css';

export const metadata:Metadata={
  title:'NZ Holiday Pay Calculator | Annual Leave & Public Holiday Pay',
  description:'Estimate New Zealand annual leave pay and public holiday pay using current Holidays Act rules for ordinary weekly pay, average weekly earnings and time-and-a-half.',
  keywords:['holiday pay calculator NZ','annual leave calculator NZ','annual leave pay NZ','public holiday pay NZ','time and a half NZ','holiday pay NZ','Holidays Act calculator'],
  alternates:{canonical:'/nz-holiday-pay-calculator'},
  openGraph:{title:'NZ Holiday Pay Calculator | Webfit News',description:'Estimate annual leave pay and public holiday pay under current New Zealand Holidays Act rules.',url:'/nz-holiday-pay-calculator',type:'website'},
};

const sources=[
  ['Annual holiday pay','https://www.employment.govt.nz/pay-and-hours/pay-and-wages/leave-and-holiday-pay/annual-holiday-pay'],
  ['Calculating holiday and leave pay','https://www.employment.govt.nz/pay-and-hours/pay-and-wages/leave-and-holiday-pay/calculating-holiday-and-leave-pay'],
  ['Public holiday rights for employees','https://www.employment.govt.nz/leave-and-holidays/public-holidays/public-holidays-rights-for-employees'],
] as const;

export default function HolidayPayPage(){
  const faq=[
    {q:'How is annual leave pay calculated in New Zealand?',a:'When annual holidays are taken, the employee must generally be paid at least the greater of ordinary weekly pay at the start of the holiday or average weekly earnings over the previous 12 months.'},
    {q:'What are average weekly earnings for annual leave?',a:'Average weekly earnings are generally the employee’s gross earnings over the previous 12 months divided by 52.'},
    {q:'How much do I get paid for working on a public holiday?',a:'An employee who works on a public holiday must generally receive at least time-and-a-half for the time actually worked.'},
    {q:'Do I get a day in lieu for working on a public holiday?',a:'Usually yes if the public holiday is a day you would otherwise have worked. This is called an alternative holiday.'},
    {q:'Are New Zealand holiday rules changing?',a:'Yes. The Employment Leave Act is expected to replace the Holidays Act in August 2028. Until then, the current Holidays Act rules continue to apply.'},
  ];
  const ld={'@context':'https://schema.org','@graph':[
    {'@type':'WebApplication',name:'NZ Holiday Pay Calculator',url:'https://www.webfitnews.com/nz-holiday-pay-calculator',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
    {'@type':'FAQPage',mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://www.webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'NZ Holiday Pay Calculator',item:'https://www.webfitnews.com/nz-holiday-pay-calculator'}]},
  ]};

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Employment Calculator</span><h1>NZ Holiday Pay Calculator</h1><p className={styles.lead}>Estimate annual leave pay and public-holiday pay under the current New Zealand Holidays Act rules.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>Current law:</strong> Holidays Act rules remain in force until the Employment Leave Act takes effect in August 2028.</div></div><div className={styles.heroCard}><span>Two useful checks</span><strong>Annual leave + public holiday pay</strong><small>Use the calculator as a guide, then verify unusual payroll situations with Employment New Zealand or your payroll provider.</small></div></section>

    <HolidayPayCalculator/>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>How it works</span><h2>Annual leave pay: OWP vs AWE</h2><p>When you take annual holidays, the minimum payment is generally the greater of your ordinary weekly pay (OWP) or your average weekly earnings (AWE). AWE is usually gross earnings over the previous 12 months divided by 52.</p></div><div className={styles.infoGrid}><article><h3>Ordinary weekly pay</h3><p>The amount normally received for an ordinary working week, including regular payments that are part of normal weekly earnings.</p></article><article><h3>Average weekly earnings</h3><p>Gross earnings over the 12 months before the holiday, divided by 52. Employers compare this against OWP and use the greater amount.</p></article><article><h3>Four weeks after 12 months</h3><p>Employees generally become entitled to four weeks of paid annual holidays after 12 months of continuous employment.</p></article></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Public holidays</span><h2>Working on a public holiday</h2><p>If you work on a public holiday, you must generally be paid at least time-and-a-half for the time actually worked. If the day is an otherwise working day for you, you are usually entitled to an alternative holiday as well.</p></div><div className={styles.infoGrid}><article><h3>Time-and-a-half</h3><p>The minimum public-holiday rate is generally 1.5 times the relevant rate for the hours worked on the holiday.</p></article><article><h3>Alternative holiday</h3><p>If it is a day you would otherwise have worked, you usually receive a paid alternative holiday—often called a day in lieu.</p></article><article><h3>If you do not work</h3><p>If the public holiday falls on a day you would otherwise work and you do not work, you are generally entitled to a paid day off.</p><Link className={styles.cta} href="/public-holidays">See NZ public holidays →</Link></article></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Employment New Zealand guidance</h2></div><div className={styles.sourceList}>{sources.map(([name,url])=><a key={url} href={url} target="_blank" rel="noopener noreferrer"><div><strong>{name}</strong><small>Employment New Zealand</small></div><span>Open official page ↗</span></a>)}</div></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ holiday pay: common questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Calculator notice:</strong> This is an estimate for common situations, not payroll, legal or employment advice. Holiday-pay calculations can be more complex where hours, commissions, bonuses, allowances, shifts or work patterns vary.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
