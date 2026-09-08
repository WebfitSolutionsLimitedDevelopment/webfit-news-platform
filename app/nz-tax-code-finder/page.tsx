import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import TaxCodeFinder from './TaxCodeFinder';
import {getTaxCodeSourceSnapshot,secondaryTaxBands,taxCodeSources} from '@/lib/nz-tax-codes';

export const revalidate=604800;

export const metadata:Metadata={
  title:'NZ Tax Code Finder 2026 | Which IRD Tax Code Should I Use?',
  description:'Find your likely NZ tax code for a main job, second job or student loan. Check M, ME, SB, S, SH, ST, SA and SL codes against current IRD rules.',
  keywords:['NZ tax code finder','which tax code should I use NZ','tax code NZ','IRD tax code','M tax code NZ','ME tax code NZ','secondary tax code NZ','IR330'],
  alternates:{canonical:'/nz-tax-code-finder'},
  openGraph:{title:'NZ Tax Code Finder 2026 | Which IRD Tax Code Should I Use?',description:'Answer a few questions to find the likely IRD tax code for your New Zealand salary or wages.',url:'/nz-tax-code-finder',type:'website'},
};

function formatChecked(value:string){return new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(value));}

export default async function TaxCodeFinderPage(){
  const snapshot=await getTaxCodeSourceSnapshot();
  const faq=[
    {q:'Which tax code should I use in New Zealand?',a:'Your main or highest income source normally uses a main tax code such as M or ME. Other salary or wage income generally uses a secondary code such as SB, S, SH, ST or SA based on your estimated total annual income. Add SL where a New Zealand student loan applies.'},
    {q:'What is the M tax code in New Zealand?',a:'M is the standard main-income code for salary or wages when the ME conditions do not apply. You should have only one main income source.'},
    {q:'What is the ME tax code?',a:'ME is a main-income code that includes Independent Earner Tax Credit treatment for eligible people. IRD says the credit has income and other eligibility conditions, so ME should not be chosen from salary alone.'},
    {q:'What tax code should I use for a second job?',a:'A second salary or wage generally uses a secondary tax code. IRD bases SB, S, SH, ST or SA on your estimated annual total income from all sources, not only the pay from the second job.'},
    {q:'What does SL mean on a tax code?',a:'SL tells the payer that a New Zealand student loan applies. It can be added to main or secondary salary and wage codes, for example M SL or SH SL.'},
    {q:'What happens if I do not give my employer an IR330?',a:'IRD says an employer generally deducts tax at the non-declaration rate of 45% if you do not provide an IR330 tax code declaration.'},
  ];
  const faqEntities=faq.map(item=>({
    '@type':'Question',
    name:item.q,
    acceptedAnswer:{'@type':'Answer',text:item.a},
  }));
  const ld={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebApplication',name:'NZ Tax Code Finder',url:'https://webfitnews.com/nz-tax-code-finder',applicationCategory:'FinanceApplication',operatingSystem:'Web',description:metadata.description},
      {'@type':'FAQPage',mainEntity:faqEntities},
      {'@type':'BreadcrumbList',itemListElement:[
        {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
        {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
        {'@type':'ListItem',position:3,name:'NZ Tax Code Finder',item:'https://webfitnews.com/nz-tax-code-finder'},
      ]},
    ],
  };

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Tax Code Tool</span><h1>NZ Tax Code Finder 2026</h1><p className={styles.lead}>Which IRD tax code should you use? Answer a few questions for a likely code, then confirm it on the current IR330 before giving it to your employer or payer.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>IRD sources checked:</strong> {snapshot.sourcesChecked}/{snapshot.totalSources} · {formatChecked(snapshot.checkedAt)}</div></div><div className={styles.heroCard}><span>Quick answer</span><strong>Main job: M or ME</strong><small>Second income: usually SB, S, SH, ST or SA. Add SL for a student loan.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Tax code checker</span><h2>Which NZ tax code should I use?</h2><p>Start with whether this is your main or secondary income, then your expected annual income and student-loan status. The result covers common salary-and-wage situations.</p></div><TaxCodeFinder/></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Quick reference</span><h2>NZ tax codes explained</h2></div><div className={styles.infoGrid}>
      <article><h3>M / M SL</h3><p>For the main or highest source of salary or wages when ME does not apply. Use M SL where a New Zealand student loan applies.</p></article>
      <article><h3>ME / ME SL</h3><p>Main-income codes with Independent Earner Tax Credit treatment. Eligibility depends on IRD conditions, not just your salary band.</p></article>
      <article><h3>SB, S, SH, ST, SA</h3><p>Common secondary-income codes. The code is chosen using expected annual total income from all sources.</p></article>
      <article><h3>No IR330?</h3><p>IRD says the non-declaration rate is generally 45% if you do not give your employer the required tax code declaration.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Second job tax code</span><h2>Secondary tax codes and current income bands</h2><p>Your second job is not automatically taxed at one fixed rate. IRD uses your estimated total annual income to select the secondary code.</p></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Estimated total annual income</th><th>Secondary code</th><th>Rate before ACC</th><th>With student loan</th></tr></thead><tbody>{secondaryTaxBands.map(b=><tr key={b.code}><td>{b.max===Infinity?`$${b.min.toLocaleString()}+`:`$${b.min.toLocaleString()} – $${b.max.toLocaleString()}`}</td><td><strong>{b.code}</strong></td><td>{b.rate}%</td><td>{b.code} SL</td></tr>)}</tbody></table></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>When to change it</span><h2>Your tax code can change during the year</h2></div><div className={styles.infoGrid}>
      <article><h3>You start or leave a second job</h3><p>A change in the number or size of income sources can change which income is main and which secondary code fits.</p></article>
      <article><h3>Your student loan changes</h3><p>Taking out or paying off a student loan can mean adding or removing SL from the tax code.</p></article>
      <article><h3>Your expected income changes</h3><p>A material change in total annual income can move secondary income into a different code band.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Special situations</span><h2>When this tax code finder is not enough</h2></div><div className={styles.infoGrid}>
      <article><h3>Benefits, NZ Super and pensions</h3><p>These income sources can affect the IR330 flow. Follow the official declaration rather than assuming the highest-paying job always determines every code.</p></article>
      <article><h3>Contractors and schedular payments</h3><p>Contractor withholding can use different forms and rates, including IR330C, rather than the ordinary salary-and-wage flow.</p></article>
      <article><h3>Tailored tax code</h3><p>IRD can approve tailored tax options where ordinary codes are likely to cause a large year-end refund or bill.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official IRD sources</span><h2>Confirm your code before submitting IR330</h2></div><div className={styles.sourceList}>{taxCodeSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.label}</strong><span>Official Inland Revenue guidance ↗</span></a>)}</div><p><Link className={styles.cta} href="/nz-paye-calculator">Calculate NZ PAYE and take-home pay →</Link> <Link className={styles.cta} href="/nz-student-loan-calculator">Calculate student loan deductions →</Link> <Link className={styles.cta} href="/nz-kiwisaver-calculator">Calculate KiwiSaver contributions →</Link></p></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ tax code questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Tax information notice:</strong> This finder covers common salary and wage situations only. It does not replace the current IR330 declaration, an IRD tailored tax code or professional tax advice.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
