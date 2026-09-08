import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { getPassportSnapshot,passportSources } from '@/lib/passport-renewal';
import styles from '@/components/UtilityGuide.module.css';

export const revalidate=604800;

export const metadata:Metadata={
  title:'NZ Passport Renewal 2026 | Cost, Processing Time & Online Renewal',
  description:'Renew an NZ passport in 2026. Check the current adult and child fees, standard and urgent processing times, photo/referee requirements and official online renewal link.',
  keywords:['nz passport renewal','New Zealand passport renewal','renew NZ passport','NZ passport cost','NZ passport processing time','NZ passport renewal online','New Zealand passport application'],
  alternates:{canonical:'/nz-passport-renewal'},
  openGraph:{title:'NZ Passport Renewal 2026 | Cost, Processing Time & Online Renewal',description:'Check current New Zealand passport renewal fees, processing times, photo rules, referee requirements and the official online renewal link.',url:'/nz-passport-renewal',type:'website'},
};

const f=(v:string)=>new Intl.DateTimeFormat('en-NZ',{day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Pacific/Auckland',timeZoneName:'short'}).format(new Date(v));

export default async function Page(){
  const s=await getPassportSnapshot();
  const faq=[
    {q:'How much does it cost to renew an NZ passport in 2026?',a:`The current standard adult passport fee in New Zealand is NZD $${s.adultStandard}, plus courier delivery. Urgent adult service is NZD $${s.adultUrgent}.`},
    {q:'How long does an NZ passport renewal take?',a:`NZ Passports currently says to allow at least ${s.standardTime} for standard processing, plus delivery time. Urgent applications aim for ${s.urgentTime}.`},
    {q:'Can I renew my New Zealand passport online?',a:'Yes. NZ Passports says the fastest and easiest way for most citizens to renew is online.'},
    {q:'What do I need to renew my NZ passport?',a:'You generally need a compliant passport photo, an identity referee, previous passport details if applicable, a payment method and delivery details.'},
    {q:'How much is urgent NZ passport renewal?',a:`The current urgent adult passport fee is NZD $${s.adultUrgent}, plus delivery. Urgent processing aims for ${s.urgentTime}, subject to demand and required checks.`},
  ];
  const ld={'@context':'https://schema.org','@graph':[
    {'@type':'WebPage',name:'NZ Passport Renewal 2026',url:'https://webfitnews.com/nz-passport-renewal',description:metadata.description,dateModified:s.checkedAt,isPartOf:{'@type':'WebSite',name:'Webfit News',url:'https://webfitnews.com'}},
    {'@type':'FAQPage',mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'NZ Passport Renewal',item:'https://webfitnews.com/nz-passport-renewal'}]}
  ]};

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Passport Renewal 2026</span><h1>NZ Passport Renewal 2026</h1><p className={styles.lead}>Check the current passport renewal cost, standard and urgent processing times, photo and referee requirements, and the official online renewal link.</p><div className={styles.freshness}><span className={s.sourceOk?styles.liveDot:styles.fallbackDot}/><strong>Official sources checked:</strong> {f(s.checkedAt)} · refreshes every 7 days</div></div><div className={styles.heroCard}><span>Standard adult passport</span><strong>NZD ${s.adultStandard}</strong><small>Courier delivery is additional.</small></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Quick answer</span><h2>NZ passport renewal cost and time at a glance</h2><p>A standard adult passport currently costs <strong>NZD ${s.adultStandard}</strong> plus courier delivery. Allow at least <strong>{s.standardTime}</strong> for standard processing plus delivery. Urgent adult service costs <strong>NZD ${s.adultUrgent}</strong> and aims for <strong>{s.urgentTime}</strong>.</p></div></section>

    <nav className={styles.jumpNav}><span>Jump to:</span><a href="#cost">Cost</a><a href="#time">Processing time</a><a href="#need">What you need</a><a href="#apply">Apply online</a><a href="#faq">FAQs</a></nav>

    <section id="cost" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Current fees</span><h2>NZ passport renewal cost 2026</h2></div><div className={styles.cardGrid}><article className={styles.card}><h3>Adult standard</h3><p>NZD ${s.adultStandard}</p></article><article className={styles.card}><h3>Child standard</h3><p>NZD ${s.childStandard}</p></article><article className={styles.card}><h3>Adult urgent</h3><p>NZD ${s.adultUrgent}</p></article></div></section>

    <section id="time" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Timing</span><h2>NZ passport processing time 2026</h2></div><div className={styles.infoGrid}><article><h3>Standard processing</h3><p>Allow at least {s.standardTime}, then add delivery time.</p></article><article><h3>Urgent processing</h3><p>NZ Passports aims to process urgent applications within {s.urgentTime}, depending on demand and checks.</p></article></div></section>

    <section id="need" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Checklist</span><h2>What you need to renew an NZ passport</h2></div><div className={styles.cardGrid}><article className={styles.card}><h3>Passport photo</h3><p>A recent compliant digital passport photo. Selfies are rejected and photos must meet the official technical rules.</p></article><article className={styles.card}><h3>Identity referee</h3><p>An eligible referee aged 16+ who has known you for more than one year and meets NZ Passports requirements.</p></article><article className={styles.card}><h3>Previous details and payment</h3><p>Your previous passport details if applicable, payment method and delivery information.</p></article></div></section>

    <section id="apply" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official application</span><h2>Renew your New Zealand passport online</h2><p>NZ Passports says online is the fastest way for most citizens to apply or renew.</p><a className={styles.cta} href="https://www.passports.govt.nz/most-citizens-can-apply-for-their-passport-online/most-citizens-can-apply-for-their-passport-online" target="_blank" rel="noopener noreferrer">Renew NZ passport on the official site ↗</a></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Sources</span><h2>Official New Zealand passport sources</h2></div><div className={styles.sourceList}>{passportSources.map(x=><a key={x.url} href={x.url} target="_blank" rel="noopener noreferrer"><div><strong>{x.name}</strong><small>{x.primary?'Primary fee source':'Official cross-check'}</small></div><span>Open official page ↗</span></a>)}</div></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ passport renewal questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Information notice:</strong> Fees, timeframes and passport requirements can change. NZ Passports remains the authoritative source.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
