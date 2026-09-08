import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import CitizenshipEligibilityChecker from './CitizenshipEligibilityChecker';
import {citizenshipSources,getCitizenshipSnapshot} from '@/lib/nz-citizenship';

export const revalidate=86400;

export const metadata:Metadata={
  title:'NZ Citizenship 2026 | Eligibility, Fees, 5-Year Rule & Application',
  description:'Check New Zealand citizenship by grant eligibility, the 5-year and 1,350-day presence rules, current 2026 fees, application steps, English and character requirements.',
  keywords:['NZ citizenship','New Zealand citizenship','NZ citizenship application','NZ citizenship eligibility','NZ citizenship requirements','NZ citizenship fee 2026','NZ citizenship 5 year rule','citizenship by grant NZ','NZ citizenship processing time'],
  alternates:{canonical:'/nz-citizenship'},
  openGraph:{title:'NZ Citizenship 2026 | Eligibility, Fees & Application',description:'Current New Zealand citizenship by grant requirements, fees, presence rules and application guidance.',url:'/nz-citizenship',type:'website'},
};

const feeRows=[
  ['Citizenship by grant — adult (16+)','$641'],
  ['Citizenship by grant — child (15 and under)','$320'],
  ['Citizenship by descent — registration','$278'],
  ['Citizenship by descent + standard passport — adult','$525'],
  ['Citizenship by descent + standard passport — child','$422'],
];

const steps=[
  ['1','Confirm the right citizenship pathway','New Zealand citizenship can arise by birth, descent or grant. People born outside NZ to a qualifying NZ-citizen parent may need descent registration rather than a grant application.'],
  ['2','Check grant eligibility','For a standard adult grant, check indefinite residence status, eligible physical presence, English, character and intention to continue living in New Zealand.'],
  ['3','Prepare documents','Typical evidence includes a birth certificate or birth record, passport or travel document, photo and an identity referee or witness.'],
  ['4','Apply and pay','Applications can be made online, in person or by post. Online applicants need digital copies, an identity referee and a credit or debit card.'],
  ['5','Wait for the decision','The government currently says citizenship applications generally take about 3 to 14 months for a decision.'],
  ['6','Attend a ceremony','After approval, most applicants complete citizenship at a ceremony. A New Zealand passport is a separate application after citizenship is completed.'],
];

export default async function NzCitizenshipPage(){
  const snapshot=await getCitizenshipSnapshot();
  const checked=new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(snapshot.checkedAt));
  const faq=[
    ['How long do you need to live in New Zealand before applying for citizenship?','For the standard grant route, the presence test looks at the 5 years immediately before you apply. You generally need at least 1,350 eligible days in total and at least 240 eligible days in each 12-month period.'],
    ['How much does NZ citizenship cost in 2026?','From 28 August 2026, a citizenship-by-grant application costs NZD $641 for an adult aged 16 or over and NZD $320 for a child aged 15 or under.'],
    ['Do I need permanent residence before NZ citizenship?','You need to be entitled under immigration law to be in New Zealand indefinitely. The exact immigration-status assessment is made by DIA and Immigration New Zealand records are used in the official eligibility check.'],
    ['What English level is needed for NZ citizenship?','Government guidance says applicants need to be able to hold a basic conversation in English, or speak English in everyday situations.'],
    ['Is there an NZ citizenship test now?','Not yet for current applicants. The government has announced a citizenship test for most citizenship-by-grant applicants from late 2027. The current grant process remains in place until that future change takes effect.'],
    ['How long does an NZ citizenship application take?','The government currently says it takes about 3 to 14 months to find out whether an application has been approved.'],
  ];

  const faqEntities=faq.map(([q,a])=>{
    return {
      '@type':'Question',
      name:q,
      acceptedAnswer:{
        '@type':'Answer',
        text:a,
      },
    };
  });

  const ld={
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'WebApplication',
        name:'NZ Citizenship Eligibility Checker',
        url:'https://www.webfitnews.com/nz-citizenship',
        applicationCategory:'GovernmentService',
        operatingSystem:'Web',
      },
      {
        '@type':'FAQPage',
        mainEntity:faqEntities,
      },
      {
        '@type':'BreadcrumbList',
        itemListElement:[
          {'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},
          {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://www.webfitnews.com/nz-guides'},
          {'@type':'ListItem',position:3,name:'NZ Citizenship',item:'https://www.webfitnews.com/nz-citizenship'},
        ],
      },
    ],
  };

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}><div><span className={styles.eyebrow}>Webfit News NZ Guides</span><h1>NZ Citizenship 2026</h1><p className={styles.lead}>Check the standard citizenship-by-grant rules, current fees, presence requirements and application steps before using the official Department of Internal Affairs service.</p></div><div className={styles.heroCard}><span>Standard adult presence rule</span><strong>1,350 days</strong><small>Across the 5 years before applying, with at least 240 days in each 12-month period.</small></div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Eligibility checker</span><h2>Do you appear to meet the core grant requirements?</h2><p>This tool checks the common adult criteria only. Children, Samoan applicants and unusual immigration or character situations can follow different rules.</p></div><CitizenshipEligibilityChecker/></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Presence rule</span><h2>The 5-year citizenship presence test</h2></div><div className={styles.infoGrid}><article><h3>1,350 days total</h3><p>You generally need at least 1,350 days physically present in New Zealand during the 5 years immediately before the application date, while entitled to be here indefinitely.</p></article><article><h3>240 days every year</h3><p>You also generally need at least 240 eligible days in each of the five 12-month periods. One long absence can therefore matter even if your five-year total looks high.</p></article><article><h3>Future travel matters</h3><p>If you plan to live overseas, the standard intention requirement can become relevant. Limited statutory exceptions exist for certain NZ-linked overseas service or employment.</p></article></div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Current fees</span><h2>NZ citizenship fees from 28 August 2026</h2></div><div style={{overflowX:'auto'}}><table><thead><tr><th>Application</th><th>Fee</th></tr></thead><tbody>{feeRows.map(r=><tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td></tr>)}</tbody></table></div><p>Citizenship by descent is a separate pathway from citizenship by grant. If you were born outside New Zealand and a parent was a qualifying New Zealand citizen when you were born, check the descent rules before paying a grant fee.</p></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>How to apply</span><h2>NZ citizenship application steps</h2></div><div className={styles.infoGrid}>{steps.map(([n,t,d])=><article key={n}><span className={styles.kicker}>Step {n}</span><h3>{t}</h3><p>{d}</p></article>)}</div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Future change</span><h2>Citizenship test planned from late 2027</h2></div><div className={styles.infoGrid}><article><h3>No test for current 2026 applications</h3><p>The Department of Internal Affairs says there is currently no change to the citizenship-by-grant process.</p></article><article><h3>Most grant applicants later</h3><p>A citizenship test is planned for most citizenship-by-grant applicants from late 2027. Details such as exemptions, cost and exact implementation are still being developed.</p></article><article><h3>Current law still applies</h3><p>Applicants today must still meet the existing presence, character, English, responsibilities-and-privileges and intention requirements.</p></article></div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Related guides</span><h2>After citizenship approval</h2></div><div className={styles.infoGrid}><article><h3>Apply for a New Zealand passport</h3><p>Citizenship approval does not automatically issue a passport. Passport application is a separate process.</p><Link href="/new-zealand-passport-application">Open NZ passport application guide →</Link></article><article><h3>Renew an existing NZ passport</h3><p>If you are already a New Zealand citizen and simply need a new passport, use the renewal guide instead.</p><Link href="/nz-passport-renewal">Open passport renewal guide →</Link></article></div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Checked against New Zealand Government guidance</h2><p>Last checked {checked}. {snapshot.reachable}/{snapshot.total} official source pages responded successfully.</p></div><div className={styles.infoGrid}>{citizenshipSources.map(s=><article key={s.url}><h3>{s.label}</h3><a href={s.url} target="_blank" rel="noreferrer">Open official source →</a></article>)}</div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ citizenship questions</h2></div><div className={styles.infoGrid}>{faq.map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></section>

      <aside className={styles.disclaimer}><strong>Important:</strong> This is general information, not an official eligibility decision or legal advice. The Department of Internal Affairs makes citizenship decisions and can assess exceptions, character issues, travel records, children, Samoan applicants and other special cases differently.</aside>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/>
  </>;
}
