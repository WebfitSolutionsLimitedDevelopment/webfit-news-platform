import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import RatesRebateCalculator from './RatesRebateCalculator';
import {getRatesRebateSnapshot,ratesRebateSources} from '@/lib/rates-rebate';

export const revalidate=86400;
export const metadata:Metadata={
  title:'Rates Rebate Calculator NZ 2026/27 | Check Your $830 Rebate',
  description:'Calculate your estimated NZ rates rebate for 2026/27 using the $830 maximum, household income, SuperGold status, dependants and annual council rates.',
  alternates:{canonical:'/nz-rates-rebate-calculator'},
  robots:{index:true,follow:true},
  openGraph:{title:'Rates Rebate Calculator NZ 2026/27 | Check Your $830 Rebate',description:'Estimate your 2026/27 New Zealand council rates rebate using current income thresholds, SuperGold rules and dependants.',url:'/nz-rates-rebate-calculator',type:'website'},
  twitter:{card:'summary_large_image',title:'Rates Rebate Calculator NZ 2026/27 | $830 Maximum',description:'Estimate a 2026/27 NZ council rates rebate using current thresholds, SuperGold status and dependants.'},
};
const faq:[string,string][]=[
 ['How much rates rebate can I get in NZ in 2026/27?','The maximum rates rebate for the rating year beginning 1 July 2026 is $830. Your actual rebate can be lower depending on annual rates, household income, dependants and the statutory calculation.'],
 ['What is the rates rebate income limit for 2026/27?','The income abatement threshold is $33,210 for most ratepayers and $46,400 for a SuperGold Card holder. The threshold increases by $500 for each dependant. Income above the threshold can still produce a partial rebate.'],
 ['Can I get a rates rebate if my income is over $33,210?','Possibly. Income above the applicable threshold reduces the calculated rebate by $1 for each $8 above that threshold, so being over the headline threshold does not automatically make the rebate zero.'],
 ['Do SuperGold Card holders get a higher rates rebate threshold?','Yes. For 2026/27, a qualifying ratepayer who holds a SuperGold Card when applying has a $46,400 income abatement threshold before dependant adjustments.'],
 ['Do I need to apply for a rates rebate every year?','Yes. Rates rebates are not automatic. You need to apply for each rating year through your local council, which makes the final assessment.'],
];
export default async function Page(){
 const snapshot=await getRatesRebateSnapshot();
 const checked=new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(snapshot.checkedAt));
 const faqEntities=faq.map(([q,a])=>({ '@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}));
 const breadcrumbItems=[
  {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
  {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
  {'@type':'ListItem',position:3,name:'Rates Rebate Calculator NZ',item:'https://webfitnews.com/nz-rates-rebate-calculator'},
 ];
 const ld={'@context':'https://schema.org','@graph':[
  {'@type':'WebPage',name:'Rates Rebate Calculator NZ 2026/27',url:'https://webfitnews.com/nz-rates-rebate-calculator',description:metadata.description,dateModified:snapshot.checkedAt,isPartOf:{'@type':'WebSite',name:'Webfit News',url:'https://webfitnews.com'}},
  {'@type':'WebApplication',name:'Rates Rebate Calculator NZ 2026/27',url:'https://webfitnews.com/nz-rates-rebate-calculator',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
  {'@type':'FAQPage',mainEntity:faqEntities},
  {'@type':'BreadcrumbList',itemListElement:breadcrumbItems},
 ]};
 return <><SiteHeader/><main className={`shell ${styles.page}`}>
  <section className={styles.hero}><div><span className={styles.eyebrow}>2026/27 New Zealand Rates Rebate</span><h1>Rates Rebate Calculator NZ 2026/27</h1><p className={styles.lead}>Check how much New Zealand rates rebate you may qualify for using the current $830 maximum, your annual rates, household income, SuperGold status and dependants.</p></div><div className={styles.heroCard}><span>Maximum rates rebate</span><strong>$830</strong><small>For the rating year from 1 July 2026 to 30 June 2027.</small></div></section>

  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Quick answer</span><h2>NZ rates rebate 2026/27 at a glance</h2><p>The maximum rebate is <strong>$830</strong>. The standard income abatement threshold is <strong>$33,210</strong>, or <strong>$46,400</strong> for a qualifying SuperGold Card holder, with another <strong>$500 per dependant</strong>. Income above the threshold can still qualify for a partial rebate.</p></div></section>

  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Calculator</span><h2>Calculate your estimated NZ rates rebate</h2><p>Enter your annual council rates, household income, number of dependants and SuperGold status for an instant 2026/27 estimate.</p></div><RatesRebateCalculator/></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>2026/27 settings</span><h2>Rates rebate income thresholds and maximum</h2></div><div className={styles.infoGrid}>
   <article><h3>$830 maximum rebate</h3><p>The statutory maximum rates rebate increased from $805 to $830 from 1 July 2026.</p></article>
   <article><h3>$33,210 standard income threshold</h3><p>For most ratepayers, the 2026/27 income abatement threshold is $33,210.</p></article>
   <article><h3>$46,400 SuperGold threshold</h3><p>A qualifying ratepayer who holds a SuperGold Card when applying has a higher $46,400 income abatement threshold.</p></article>
   <article><h3>$500 per dependant</h3><p>The applicable income threshold increases by $500 for each dependant.</p></article>
  </div></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>How it works</span><h2>How the NZ rates rebate is calculated</h2></div><div className={styles.infoGrid}>
   <article><h3>Start with annual rates</h3><p>The formula starts with two-thirds of the amount by which annual rates exceed $160.</p></article>
   <article><h3>Apply the income adjustment</h3><p>If household income exceeds the applicable threshold, the calculated rebate is reduced by $1 for every $8 above that threshold.</p></article>
   <article><h3>Apply the $830 cap</h3><p>The final statutory rebate cannot exceed $830 for the 2026/27 rating year.</p></article>
   <article><h3>Your council decides</h3><p>Your local council makes the final decision after checking the application and relevant property, residence, rates and income information.</p></article>
  </div></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Eligibility</span><h2>Who can apply for a rates rebate in New Zealand?</h2><p>The scheme is primarily for qualifying ratepayers of residential property they use as their usual home. You apply through your local council for each rating year. Even if your income is above the headline threshold, it is still worth checking because the statutory formula can produce a partial rebate.</p></div></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Related guides</span><h2>More New Zealand household and money guides</h2></div><div className={styles.infoGrid}><article><h3>PAYE Calculator NZ</h3><p>Estimate take-home pay after tax, ACC, KiwiSaver and student loan deductions.</p><Link href="/nz-paye-calculator">Calculate NZ take-home pay →</Link></article><article><h3>NZ Tenancy & Rent Guide</h3><p>Check common New Zealand tenancy, bond and rent-increase rules.</p><Link href="/nz-tenancy-rent-guide">Open tenancy and rent guide →</Link></article><article><h3>NZ Superannuation Guide</h3><p>Review New Zealand Super rates and common eligibility information.</p><Link href="/nz-superannuation-guide">Open NZ Super guide →</Link></article></div></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Official NZ rates rebate information</h2><p>Last checked {checked}. {snapshot.reachable}/{snapshot.total} official source pages responded successfully.</p></div><div className={styles.infoGrid}>{ratesRebateSources.map(s=><article key={s.url}><h3>{s.label}</h3><a href={s.url} target="_blank" rel="noreferrer">Open official source →</a></article>)}</div></section>
  <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ rates rebate calculator: common questions</h2></div><div className={styles.infoGrid}>{faq.map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></section>
  <aside className={styles.disclaimer}><strong>Important:</strong> This calculator is a general estimate based on the statutory formula. It does not determine legal eligibility. Ownership structures, moves during the rating year, household circumstances and council assessment can affect the result.</aside><p><Link href="/nz-guides">← Back to NZ Guides</Link></p>
 </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
