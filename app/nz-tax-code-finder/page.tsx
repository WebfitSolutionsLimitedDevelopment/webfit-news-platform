import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import TaxCodeFinder from './TaxCodeFinder';
import {getTaxCodeSourceSnapshot,secondaryTaxBands,taxCodeSources} from '@/lib/nz-tax-codes';

export const revalidate=604800;

export const metadata:Metadata={
  title:'NZ Tax Code Finder 2026 | M, ME, SB, S, SH, ST, SA & SL Codes',
  description:'Find the likely New Zealand IRD tax code for main income, secondary income and student loans, with current 2026 tax-code bands and official IR330 guidance.',
  keywords:['NZ tax code finder','tax code NZ','M tax code NZ','ME tax code NZ','secondary tax code NZ','SB tax code','S tax code','SH tax code','ST tax code','SA tax code','SL tax code','IR330'],
  alternates:{canonical:'/nz-tax-code-finder'},
  openGraph:{title:'NZ Tax Code Finder 2026 | Webfit News',description:'Work out the likely IRD tax code for common main-income, secondary-income and student-loan situations.',url:'/nz-tax-code-finder',type:'website'},
};

function formatChecked(value:string){return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(value));}

export default async function TaxCodeFinderPage(){
  const snapshot=await getTaxCodeSourceSnapshot();
  const faq=[
    {q:'What is the M tax code in New Zealand?',a:'M is the standard code for a main or highest source of salary or wages when the ME conditions do not apply.'},
    {q:'What is ME?',a:'ME is a main-income code that applies Independent Earner Tax Credit treatment when the person meets the IETC conditions. A student-loan borrower who qualifies uses ME SL.'},
    {q:'What are the secondary tax codes?',a:'The common secondary codes are SB, S, SH, ST and SA. The correct code depends on estimated annual total income from all sources.'},
    {q:'What does SL mean on a tax code?',a:'SL indicates a New Zealand student loan. It can be added to main or secondary salary and wage tax codes, such as M SL or SH SL.'},
    {q:'Do I still need an IR330?',a:'Yes. The finder is a guide. Employees give their employer a completed IR330 tax code declaration, and must update the payer if their code changes.'},
  ];
  const ld={'@context':'https://schema.org','@graph':[
    {'@type':'WebApplication',name:'NZ Tax Code Finder',url:'https://www.webfitnews.com/nz-tax-code-finder',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
    {'@type':'FAQPage',mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://www.webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'NZ Tax Code Finder',item:'https://www.webfitnews.com/nz-tax-code-finder'}]},
  ]};

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Tax Guide</span><h1>NZ Tax Code Finder</h1><p className={styles.lead}>Work out the likely IRD tax code for common salary and wage situations, including main income, secondary income and student loans.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>IRD sources checked:</strong> {snapshot.sourcesChecked}/{snapshot.totalSources} · {formatChecked(snapshot.checkedAt)}</div></div><div className={styles.heroCard}><span>Common codes</span><strong>M · ME · SB · S · SH · ST · SA</strong><small>Add SL when a New Zealand student loan applies.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Finder</span><h2>Find your likely tax code</h2><p>Answer the questions below, then confirm the result using IRD's IR330 declaration.</p></div><TaxCodeFinder/></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Main income</span><h2>M, ME, M SL and ME SL</h2></div><div className={styles.infoGrid}>
      <article><h3>M</h3><p>Used for a main or highest source of salary or wages when ME does not apply.</p></article>
      <article><h3>ME</h3><p>Main income with Independent Earner Tax Credit treatment. IETC eligibility conditions still need to be satisfied.</p></article>
      <article><h3>M SL / ME SL</h3><p>The corresponding main-income codes where the employee also has a New Zealand student loan.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Secondary income</span><h2>Secondary tax codes and current bands</h2><p>IRD bases the secondary code on estimated annual total income from all sources.</p></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Total annual income</th><th>Code</th><th>Rate before ACC</th><th>With student loan</th></tr></thead><tbody>{secondaryTaxBands.map(b=><tr key={b.code}><td>{b.max===Infinity?`$${b.min.toLocaleString()}+`:`$${b.min.toLocaleString()} – $${b.max.toLocaleString()}`}</td><td><strong>{b.code}</strong></td><td>{b.rate}%</td><td>{b.code} SL</td></tr>)}</tbody></table></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Important</span><h2>When this finder is not enough</h2></div><div className={styles.infoGrid}>
      <article><h3>Benefits and NZ Super</h3><p>MSD income, NZ Super and Veteran's Pension can change which source is treated as the main income. Follow the IR330 flowchart.</p></article>
      <article><h3>Special categories</h3><p>Recognised seasonal workers, casual agricultural workers, election-day workers, schedular payments and tailored tax codes use specialist codes.</p></article>
      <article><h3>Your situation changed</h3><p>Starting a second job, paying off a student loan or materially changing annual income can mean your tax code should change during the year.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>IRD tax-code references</h2></div><div className={styles.sourceList}>{taxCodeSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.label}</strong><span>Official Inland Revenue guidance ↗</span></a>)}</div><p><Link className={styles.cta} href="/nz-paye-calculator">PAYE calculator →</Link> <Link className={styles.cta} href="/nz-student-loan-calculator">Student loan calculator →</Link> <Link className={styles.cta} href="/nz-kiwisaver-calculator">KiwiSaver calculator →</Link></p></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ tax code questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Tax information notice:</strong> This finder covers common salary and wage situations only. It does not replace the IR330 declaration, an IRD tailored tax code, or professional tax advice.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
