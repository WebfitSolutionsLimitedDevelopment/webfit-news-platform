import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import RatesRebateCalculator from './RatesRebateCalculator';
import {getRatesRebateSnapshot,ratesRebateSources} from '@/lib/rates-rebate';

export const revalidate=86400;
export const metadata:Metadata={
  title:'NZ Rates Rebate Calculator 2026/27 | $830 Rebate & Eligibility',
  description:'Estimate your New Zealand rates rebate for 2026/27 using current $830 maximum, income thresholds, SuperGold rules, dependants and annual rates.',
  keywords:['rates rebate NZ','NZ rates rebate calculator','rates rebate calculator NZ','rates rebate 2026','rates rebate eligibility NZ','SuperGold rates rebate','council rates rebate NZ'],
  alternates:{canonical:'/nz-rates-rebate-calculator'},
  openGraph:{title:'NZ Rates Rebate Calculator 2026/27 | Webfit News',description:'Estimate the current New Zealand council rates rebate and understand 2026/27 eligibility rules.',url:'/nz-rates-rebate-calculator',type:'website'},
};
const faq:[string,string][]=[
 ['What is the maximum NZ rates rebate for 2026/27?','The maximum rebate for the rating year beginning 1 July 2026 is $830.'],
 ['What is the 2026/27 income threshold?','The income abatement threshold is $33,210 for most ratepayers and $46,400 for a SuperGold Card cardholder. The threshold increases by $500 for each dependant.'],
 ['Can I still get a rebate if my income is above the threshold?','Possibly. Income above the threshold reduces the calculated rebate by $1 for each $8 above the applicable threshold, so being above the threshold does not automatically mean a zero rebate.'],
 ['Do I need to apply every year?','Yes. A rates rebate is not automatic. You apply for each rating year and your local council assesses the application.'],
];
export default async function Page(){
 const snapshot=await getRatesRebateSnapshot();
 const checked=new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(snapshot.checkedAt));
 const faqEntities=faq.map(([q,a])=>({ '@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}));
 const breadcrumbItems=[
  {'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},
  {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://www.webfitnews.com/nz-guides'},
  {'@type':'ListItem',position:3,name:'NZ Rates Rebate Calculator',item:'https://www.webfitnews.com/nz-rates-rebate-calculator'},
 ];
 const ld={'@context':'https://schema.org','@graph':[
  {'@type':'WebApplication',name:'NZ Rates Rebate Calculator 2026/27',url:'https://www.webfitnews.com/nz-rates-rebate-calculator',applicationCategory:'FinanceApplication',operatingSystem:'Web'},
  {'@type':'FAQPage',mainEntity:faqEntities},
  {'@type':'BreadcrumbList',itemListElement:breadcrumbItems},
 ]};
 return <><SiteHeader/><main className={`shell ${styles.page}`}>
  <section className={styles.hero}><div><span className={styles.eyebrow}>Webfit News NZ Guides</span><h1>NZ rates rebate calculator 2026/27</h1><p className={styles.lead}>Estimate the government rates rebate for your home using the current statutory formula, then apply through your local council.</p></div><div className={styles.heroCard}><span>Maximum rebate</span><strong>$830</strong><small>For the rating year from 1 July 2026 to 30 June 2027.</small></div></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Calculator</span><h2>Estimate your rates rebate</h2><p>Enter annual rates, household income, dependants and SuperGold status.</p></div><RatesRebateCalculator/></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>2026/27 settings</span><h2>Current rates rebate thresholds</h2></div><div className={styles.infoGrid}>
   <article><h3>$830 maximum</h3><p>The statutory maximum rebate increased from $805 to $830 from 1 July 2026.</p></article>
   <article><h3>$33,210 standard threshold</h3><p>For most ratepayers, the income abatement threshold is $33,210.</p></article>
   <article><h3>$46,400 SuperGold threshold</h3><p>A ratepayer who holds a SuperGold Card when applying has a higher $46,400 income abatement threshold.</p></article>
   <article><h3>Dependants</h3><p>The applicable income threshold increases by $500 for each dependant.</p></article>
  </div></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>How it works</span><h2>The statutory calculation</h2></div><div className={styles.infoGrid}>
   <article><h3>Start with rates</h3><p>The formula starts with two-thirds of the amount by which annual rates exceed $160.</p></article>
   <article><h3>Income abatement</h3><p>If income exceeds the applicable threshold, the calculated rebate is reduced by $1 for every $8 above that threshold.</p></article>
   <article><h3>Maximum applies</h3><p>The final statutory rebate cannot exceed $830 for 2026/27.</p></article>
   <article><h3>Council assessment</h3><p>Your council makes the final decision after checking the application and relevant property, residence, rates and income information.</p></article>
  </div></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Eligibility</span><h2>Who should check the scheme?</h2><p>The scheme is primarily for qualifying ratepayers of residential property they use as their home. For the 2026/27 rating year, eligibility is assessed from 1 July 2026 and applications are made through the local council. Even if income is above the headline threshold, the formula can still produce a partial rebate.</p></div></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Government information</h2><p>Last checked {checked}. {snapshot.reachable}/{snapshot.total} official source pages responded successfully.</p></div><div className={styles.infoGrid}>{ratesRebateSources.map(s=><article key={s.url}><h3>{s.label}</h3><a href={s.url} target="_blank" rel="noreferrer">Open official source →</a></article>)}</div></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>Rates rebate questions</h2></div><div className={styles.infoGrid}>{faq.map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></section>
  <aside className={styles.disclaimer}><strong>Important:</strong> This calculator is a general estimate based on the statutory formula. It does not determine legal eligibility. Ownership structures, moves during the rating year, household circumstances and council assessment can affect the result.</aside><p><Link href="/nz-guides">← Back to NZ Guides</Link></p>
 </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
