import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import NzSuperEligibilityChecker from './NzSuperEligibilityChecker';
import { getNzSuperSnapshot, nzSuperSources } from '@/lib/nz-super';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'NZ Super Rates 2026 | Eligibility, Pension Age & Residence Rules',
  description: 'Current NZ Super rates from 1 April 2026, pension age 65, eligibility and residence rules. Check fortnightly payments and whether you may qualify.',
  keywords: ['NZ Super rates 2026', 'NZ Superannuation', 'NZ Super eligibility', 'NZ pension age', 'NZ Super residence requirements', 'New Zealand pension', 'NZ Super payment rates'],
  alternates: { canonical: '/nz-superannuation' },
  openGraph: {title:'NZ Super Rates 2026 | Eligibility & Residence Rules',description:'Check current NZ Super fortnightly rates, age 65 eligibility and residence requirements.',url:'/nz-superannuation',type:'website'},
};

const residenceRows = [
  ['On or before 30 June 1959', '10 years'],['1 July 1959–30 June 1961', '11 years'],['1 July 1961–30 June 1963', '12 years'],['1 July 1963–30 June 1965', '13 years'],['1 July 1965–30 June 1967', '14 years'],['1 July 1967–30 June 1969', '15 years'],['1 July 1969–30 June 1971', '16 years'],['1 July 1971–30 June 1973', '17 years'],['1 July 1973–30 June 1975', '18 years'],['1 July 1975–30 June 1977', '19 years'],['On or after 1 July 1977', '20 years'],
] as const;
const rateRows = [
  ['Single, living alone', '$1,110.30', '$1,294.74'],['Single, sharing accommodation', '$1,024.90', '$1,191.14'],['Couple — only one qualifies', '$854.08', '$984.28'],['Couple — both qualify, each', '$854.08', '$984.28'],['Couple — both qualify, combined', '$1,708.16', '$1,968.56'],
] as const;
const faq = [
  ['How much is NZ Super in 2026?', 'From 1 April 2026, the standard fortnightly after-tax M rate is $1,110.30 for a single person living alone, $1,024.90 for a single person sharing, and $854.08 each where the partnered rate applies.'],
  ['What age can you get NZ Super?', 'The standard NZ Super age is 65. You must also meet immigration-status, ordinary-residence and residence-duration criteria.'],
  ['Is NZ Super income tested?', 'No. New Zealand Government guidance says NZ Super itself is not based on your income, although other income can change the tax code applied to your NZ Super and may affect other assistance.'],
  ['How many years must I have lived in New Zealand?', 'The standard residence requirement is based on date of birth and ranges from 10 to 20 years from age 20. It must include at least 5 years from age 50.'],
  ['Can I work and still get NZ Super?', 'Yes. Work and Income says you can still receive NZ Super while working, although other income may change the tax code and therefore the after-tax payment.'],
  ['When should I apply for NZ Super?', 'Government guidance says you can apply when your 65th birthday is within the next 12 weeks, or once you are already 65. NZ Super is not automatically paid when you turn 65.'],
] as const;

export default async function NzSuperannuationPage() {
  const snapshot = await getNzSuperSnapshot();
  const checked = new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(snapshot.checkedAt));
  const faqEntities = faq.map(([question, answer]) => ({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}));
  const structuredData = {
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebApplication',name:'NZ Super Eligibility Checker',url:'https://webfitnews.com/nz-superannuation',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
      {'@type':'FAQPage',mainEntity:faqEntities},
      {'@type':'BreadcrumbList',itemListElement:[
        {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
        {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
        {'@type':'ListItem',position:3,name:'NZ Super Rates & Eligibility',item:'https://webfitnews.com/nz-superannuation'},
      ]},
    ],
  };

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Superannuation Guide</span><h1>NZ Super Rates 2026 & Eligibility</h1><p className={styles.lead}>Check current NZ Super fortnightly rates, pension age, residence requirements and whether you appear to meet the core eligibility rules.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>Work and Income sources checked:</strong> {snapshot.reachable}/{snapshot.total} · {checked}</div></div><div className={styles.heroCard}><span>Single, living alone</span><strong>$1,110.30 / fortnight</strong><small>After tax at M from 1 April 2026. Standard eligibility age: 65.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>NZ Super eligibility checker</span><h2>Can I get NZ Super?</h2><p>Check the common age, status and residence criteria. Work and Income makes the final eligibility decision.</p></div><NzSuperEligibilityChecker/></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Current pension rates</span><h2>NZ Super rates from 1 April 2026</h2><p>These are standard fortnightly Work and Income rates. After-tax amounts below use tax code M; your actual net payment can differ with another tax code.</p></div><div style={{overflowX:'auto'}}><table><thead><tr><th>Situation</th><th>Fortnightly after tax (M)</th><th>Fortnightly before tax</th></tr></thead><tbody>{rateRows.map(row=><tr key={row[0]}><td>{row[0]}</td><td><strong>{row[1]}</strong></td><td>{row[2]}</td></tr>)}</tbody></table></div><p>NZ Super rates are reviewed each year and normally change on 1 April.</p></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Who qualifies</span><h2>NZ Super eligibility rules at a glance</h2></div><div className={styles.infoGrid}>
      <article><h3>Age 65 or older</h3><p>The standard qualifying age is 65. NZ Super is not automatically paid when you reach 65; you need to apply.</p></article>
      <article><h3>NZ status</h3><p>You generally need to be an NZ citizen, permanent resident or residence-class visa holder and ordinarily resident in New Zealand, the Cook Islands, Niue or Tokelau when applying.</p></article>
      <article><h3>Residence history</h3><p>You need the required years of New Zealand residence from age 20, including at least five years from age 50. The total depends on your date of birth.</p></article>
      <article><h3>No income test for NZ Super</h3><p>NZ Super itself is not income tested. You can work while receiving it, although other income can affect your tax code and other assistance.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Residence requirement</span><h2>How long do you need to live in NZ for Super?</h2><p>The required total gradually increases from 10 to 20 years based on date of birth. It must include at least five years from age 50, and the years do not need to be consecutive.</p></div><div style={{overflowX:'auto'}}><table><thead><tr><th>Date of birth</th><th>Required NZ residence from age 20</th></tr></thead><tbody>{residenceRows.map(row=><tr key={row[0]}><td>{row[0]}</td><td><strong>{row[1]}</strong></td></tr>)}</tbody></table></div><p>Time in a Social Security Agreement country or NZ Realm country may help in some cases. Refugees and protected persons can have different residence calculations.</p></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Applying & payments</span><h2>When to apply and when NZ Super is paid</h2></div><div className={styles.infoGrid}>
      <article><h3>Apply up to 12 weeks before 65</h3><p>You can apply if your 65th birthday is within the next 12 weeks, or if you are already 65.</p></article>
      <article><h3>Paid fortnightly</h3><p>NZ Super is normally paid every second Tuesday. Public holidays can move a payment earlier.</p></article>
      <article><h3>Overseas pensions</h3><p>If you or your partner qualify for an overseas pension, Work and Income says you must apply for it and it may affect NZ Super.</p></article>
      <article><h3>Tax code matters</h3><p>NZ Super is taxable. If you also work or receive other taxable income, check whether NZ Super should use a main or secondary tax code.</p><Link href="/nz-tax-code-finder">Find your NZ tax code →</Link></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Work and Income NZ Super information</h2><p>Last checked {checked}. {snapshot.reachable}/{snapshot.total} official source pages responded successfully.</p></div><div className={styles.infoGrid}>{nzSuperSources.map(source=><article key={source.url}><h3>{source.label}</h3><a href={source.url} target="_blank" rel="noreferrer">Open official source →</a></article>)}</div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ Super rates and eligibility questions</h2></div><div className={styles.infoGrid}>{faq.map(([question,answer])=><article key={question}><h3>{question}</h3><p>{answer}</p></article>)}</div></section>

    <aside className={styles.disclaimer}><strong>Important:</strong> This guide is general information only. Work and Income makes the eligibility and payment decision. Overseas residence, overseas pensions, relationship status and tax circumstances can materially change the result.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/></>;
}
