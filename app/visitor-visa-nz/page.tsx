import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { getVisaSnapshot } from '@/lib/immigration';
import styles from '@/components/UtilityGuide.module.css';

export const revalidate=21600;
export const metadata:Metadata={
  title:'New Zealand Visitor Visa 2026 | Cost, Processing Time & Requirements',
  description:'NZ Visitor Visa 2026: cost from $441, 80% processed within 2 weeks, stay up to 6 or 9 months. Check requirements, funds, documents and apply online.',
  keywords:['New Zealand visitor visa','visitor visa NZ','NZ visitor visa','New Zealand tourist visa','NZ visitor visa requirements','NZ visitor visa processing time','NZ visitor visa cost'],
  alternates:{canonical:'/visitor-visa-nz'},
  openGraph:{title:'New Zealand Visitor Visa 2026 | Cost, Time & Requirements',description:'Current Visitor Visa cost, processing time, stay length, requirements and official Immigration New Zealand application link.',url:'/visitor-visa-nz',type:'website'},
};
function formatNZDate(value:string){return new Intl.DateTimeFormat('en-NZ',{day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Pacific/Auckland',timeZoneName:'short'}).format(new Date(value));}

export default async function VisitorVisaNzPage(){
  const snapshot=await getVisaSnapshot('visitor-visa');
  const cost=snapshot?.cost||'From NZD $441';
  const processing=snapshot?.processingTime||'80% within 2 weeks';
  const stay=snapshot?.lengthOfStay||'Up to either 6 months or 9 months';
  const checkedAt=snapshot?.checkedAt||new Date().toISOString();
  const sourceOk=Boolean(snapshot?.sourceOk);
  const requirements=snapshot?.applyRequirements?.length?snapshot.applyRequirements.slice(0,8):['Have genuine plans to leave New Zealand at the end of your stay.','Have enough money for your stay or an acceptable sponsor.','Meet health and character requirements where applicable.','Hold a passport that meets Immigration New Zealand validity requirements.'];
  const letsYou=snapshot?.visaLetsYou?.length?snapshot.visaLetsYou.slice(0,6):['Holiday in New Zealand.','Visit family and friends.','Study for up to 3 months.','Include eligible partner and dependent children in the application.'];
  const faq=[
    {q:'How much is a New Zealand Visitor Visa in 2026?',a:`Immigration New Zealand currently lists the standard Visitor Visa from ${cost}. Most international visitors may also need to pay the NZD $100 International Visitor Conservation and Tourism Levy. Exact fees depend on citizenship and where you apply.`},
    {q:'How long does a New Zealand Visitor Visa take?',a:`Immigration New Zealand currently says ${processing}. Its current wait-time page shows an average of about 1 week and most applications completed within 2 weeks, based on recent applications.`},
    {q:'How long can I stay in New Zealand on a Visitor Visa?',a:`The standard Visitor Visa currently allows ${stay}. A multiple-entry visa can allow up to 6 months in each 12-month period, while a single-entry visa can allow up to 9 months in an 18-month period, subject to the visa granted.`},
    {q:'Can I work on a New Zealand Visitor Visa?',a:'You cannot take employment in New Zealand on a standard Visitor Visa. Immigration New Zealand says remote work for an overseas business may be permitted under the visitor rules.'},
    {q:'Can I study on an NZ Visitor Visa?',a:'The standard Visitor Visa can allow study for up to 3 months.'},
    {q:'Do visa-waiver travellers need a Visitor Visa?',a:'Not always. Travellers from visa-waiver countries generally use the Visa Waiver Visitor Visa process and need an NZeTA before travel. Australian citizens have separate border arrangements.'},
  ];
  const faqEntities=faq.map(item=>({'@type':'Question',name:item.q,acceptedAnswer:{'@type':'Answer',text:item.a}}));
  const jsonLd={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebPage',name:'New Zealand Visitor Visa 2026',url:'https://webfitnews.com/visitor-visa-nz',description:metadata.description,dateModified:checkedAt,isPartOf:{'@type':'WebSite',name:'Webfit News',url:'https://webfitnews.com'}},
      {'@type':'FAQPage',mainEntity:faqEntities},
      {'@type':'BreadcrumbList',itemListElement:[
        {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
        {'@type':'ListItem',position:2,name:'NZ Visa & Immigration Guide',item:'https://webfitnews.com/immigration'},
        {'@type':'ListItem',position:3,name:'New Zealand Visitor Visa',item:'https://webfitnews.com/visitor-visa-nz'},
      ]},
    ],
  };

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Visitor Visa Guide</span><h1>New Zealand Visitor Visa 2026</h1><p className={styles.lead}>Check the current Visitor Visa cost, processing time, stay length and requirements before applying through Immigration New Zealand.</p><div className={styles.freshness}><span className={sourceOk?styles.liveDot:styles.fallbackDot}/><strong>Immigration NZ source checked:</strong> {formatNZDate(checkedAt)}</div></div><div className={styles.heroCard}><span>Current standard Visitor Visa</span><strong>From $441 · 80% within 2 weeks</strong><small>Stay up to either 6 months or 9 months, depending on the visa granted.</small></div></section>

    <nav className={styles.jumpNav}><span>Jump to:</span><a href="#facts">Cost & time</a><a href="#requirements">Requirements</a><a href="#funds">Funds</a><a href="#apply">Apply online</a><a href="#faq">FAQs</a></nav>

    <section id="facts" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Quick answer</span><h2>NZ Visitor Visa cost, processing time and stay</h2></div><div className={styles.cardGrid}>
      <article className={styles.card}><h3>Cost</h3><p><strong>{cost}</strong></p><p>Exact fee can depend on citizenship and application location.</p></article>
      <article className={styles.card}><h3>Processing time</h3><p><strong>{processing}</strong></p><p>Current recent-application average is about one week.</p></article>
      <article className={styles.card}><h3>Length of stay</h3><p><strong>{stay}</strong></p><p>Your eVisa conditions control the actual period granted.</p></article>
    </div></section>

    <section id="requirements" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Visitor Visa requirements</span><h2>What do you need for a New Zealand Visitor Visa?</h2><p>Immigration New Zealand assesses your genuine intention to visit, ability to support yourself, plans to leave and the other requirements of the visa.</p></div><div className={styles.infoGrid}>{requirements.map((item,index)=><article key={index}><h3>{index+1}. Requirement</h3><p>{item}</p></article>)}</div></section>

    <section id="funds" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Money & onward travel</span><h2>Show you can support your visit and leave New Zealand</h2><p>Your application may need evidence of funds or an acceptable sponsor, plus evidence you can leave New Zealand at the end of the visit. Bank statements, prepaid accommodation and onward travel evidence may be relevant depending on your application.</p></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>What the visa allows</span><h2>What can you do on a Visitor Visa?</h2></div><div className={styles.cardGrid}>{letsYou.map((item,index)=><article className={styles.card} key={index}><h3>{index+1}</h3><p>{item}</p></article>)}</div><div className={styles.notice} style={{marginTop:16}}><strong>Do not book non-refundable travel early:</strong> Immigration New Zealand recommends waiting until your Visitor Visa is approved.</div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Pacific fee reduction</span><h2>Temporary lower fee for eligible Pacific nationals</h2><p>From 1 June 2026 for 12 months, eligible Pacific nationals applying outside New Zealand have a temporary total Visitor Visa cost of <strong>NZD $161</strong>. Immigration New Zealand says this group does not pay the IVL. Parent Boost and Group Visitor Visas are excluded from this temporary reduction.</p></div></section>

    <section id="apply" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official application</span><h2>Apply for a New Zealand Visitor Visa online</h2><p>Webfit News does not accept applications or make immigration decisions. Use Immigration New Zealand’s official Visitor Visa service.</p><a className={styles.cta} href="https://www.immigration.govt.nz/visas/visitor-visa/" target="_blank" rel="noopener noreferrer">Apply on Immigration New Zealand ↗</a></div></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>New Zealand Visitor Visa questions</h2></div><div className={styles.faqList}>{faq.map(item=><details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Information notice:</strong> This is general information, not immigration advice. Visa rules, costs, evidence requirements and processing times can change. Immigration New Zealand is the authoritative source. <Link href="/immigration">Compare New Zealand visa pathways →</Link></aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/></>;
}
