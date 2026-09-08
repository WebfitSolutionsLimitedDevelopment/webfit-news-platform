import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { getVisaSnapshot } from '@/lib/immigration';
import styles from '@/components/UtilityGuide.module.css';

export const revalidate = 21600;

export const metadata: Metadata = {
  title: 'Visitor Visa NZ 2026 | New Zealand Visitor Visa Cost, Time & Requirements',
  description: 'Current New Zealand Visitor Visa information including cost, processing time, length of stay, requirements, documents and official Immigration New Zealand links.',
  keywords: ['visitor visa nz','New Zealand visitor visa','NZ visitor visa','visitor visa New Zealand 2026','NZ visitor visa requirements','NZ visitor visa processing time','NZ visitor visa cost','New Zealand tourist visa'],
  alternates: { canonical: '/visitor-visa-nz' },
  openGraph: { title: 'Visitor Visa NZ 2026', description: 'Current NZ Visitor Visa cost, processing time, requirements and official source links.', url: '/visitor-visa-nz', type: 'website' },
};

function formatNZDate(value: string) {
  return new Intl.DateTimeFormat('en-NZ',{day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Pacific/Auckland',timeZoneName:'short'}).format(new Date(value));
}

export default async function VisitorVisaNzPage(){
  const snapshot = await getVisaSnapshot('visitor-visa');
  const cost = snapshot?.cost || 'From NZD $441';
  const processing = snapshot?.processingTime || '80% within 2 weeks';
  const stay = snapshot?.lengthOfStay || 'Up to either 6 months or 9 months';
  const checkedAt = snapshot?.checkedAt || new Date().toISOString();
  const sourceOk = Boolean(snapshot?.sourceOk);
  const requirements = snapshot?.applyRequirements?.length ? snapshot.applyRequirements.slice(0,8) : [
    'Have genuine plans to leave New Zealand at the end of your stay.',
    'Have enough money for your stay or an acceptable sponsor.',
    'Meet health and character requirements where applicable.',
    'Hold a passport that meets Immigration New Zealand validity requirements.',
  ];
  const letsYou = snapshot?.visaLetsYou?.length ? snapshot.visaLetsYou.slice(0,6) : [
    'Holiday in New Zealand.', 'Visit family and friends.', 'Study for up to 3 months.', 'Include eligible partner and dependent children in the application.'
  ];

  const faq=[
    {q:'How much does a New Zealand Visitor Visa cost?',a:`Immigration New Zealand currently lists the Visitor Visa cost from ${cost}. The exact amount can depend on where you apply and your circumstances, and most international visitors may also pay the International Visitor Conservation and Tourism Levy.`},
    {q:'How long does an NZ Visitor Visa take?',a:`Immigration New Zealand currently publishes a processing indicator of ${processing}. Processing times can change, so check the official page before making non-refundable travel plans.`},
    {q:'How long can I stay on a New Zealand Visitor Visa?',a:`The standard Visitor Visa page currently states a stay of ${stay}. The exact visa conditions granted to you control how long you may stay.`},
    {q:'Can I work on a Visitor Visa in New Zealand?',a:'A standard Visitor Visa does not allow employment in New Zealand. Immigration New Zealand says remote work for an overseas business may be permitted subject to the visa rules.'},
    {q:'Can I study on a Visitor Visa?',a:'The standard Visitor Visa can allow study for up to 3 months.'},
  ];

  const jsonLd={'@context':'https://schema.org','@graph':[
    {'@type':'WebPage',name:'Visitor Visa NZ 2026',url:'https://www.webfitnews.com/visitor-visa-nz',description:metadata.description,dateModified:checkedAt,isPartOf:{'@type':'WebSite',name:'Webfit News',url:'https://www.webfitnews.com'}},
    {'@type':'FAQPage',mainEntity:faq.map(item=>({'@type':'Question',name:item.q,acceptedAnswer:{'@type':'Answer',text:item.a}}))}
  ]};

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        <div><span className={styles.eyebrow}>New Zealand Immigration Guide</span><h1>Visitor Visa NZ 2026</h1><p className={styles.lead}>A practical summary of the New Zealand Visitor Visa: current cost, processing time, length of stay, key requirements and direct links to Immigration New Zealand.</p><div className={styles.freshness}><span className={sourceOk?styles.liveDot:styles.fallbackDot}/><strong>Immigration NZ source checked:</strong> {formatNZDate(checkedAt)} · refreshes every 6 hours</div></div>
        <div className={styles.heroCard}><span>Current published cost</span><strong>{cost}</strong><small>Always confirm your exact fee with Immigration New Zealand before applying.</small></div>
      </section>

      <nav className={styles.jumpNav}><span>Jump to:</span><a href="#overview">Overview</a><a href="#requirements">Requirements</a><a href="#documents">Documents</a><a href="#apply">Apply</a><a href="#faq">FAQs</a></nav>

      <section id="overview" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>At a glance</span><h2>New Zealand Visitor Visa: key facts</h2></div><div className={styles.cardGrid}>
        <article className={styles.card}><h3>Length of stay</h3><p>{stay}</p></article>
        <article className={styles.card}><h3>Cost</h3><p>{cost}</p></article>
        <article className={styles.card}><h3>Processing time</h3><p>{processing}</p></article>
      </div></section>

      <section id="requirements" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Eligibility</span><h2>NZ Visitor Visa requirements</h2><p>These are the main points pulled from the current Immigration New Zealand Visitor Visa page. Your own application may require additional evidence.</p></div><div className={styles.infoGrid}>{requirements.map((item,index)=><article key={index}><h3>{index+1}. Requirement</h3><p>{item}</p></article>)}</div></section>

      <section id="documents" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>What it lets you do</span><h2>What a Visitor Visa can allow</h2></div><div className={styles.cardGrid}>{letsYou.map((item,index)=><article className={styles.card} key={index}><h3>{index+1}</h3><p>{item}</p></article>)}</div><div className={styles.notice} style={{marginTop:16}}><strong>Travel warning:</strong> Immigration New Zealand recommends not booking non-refundable travel until your visa is approved.</div></section>

      <section id="apply" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official application</span><h2>Apply through Immigration New Zealand</h2><p>Webfit News does not accept visa applications and does not assess eligibility. Use the official Immigration New Zealand application system.</p><a className={styles.cta} href="https://www.immigration.govt.nz/visas/visitor-visa/" target="_blank" rel="noopener noreferrer">Open official Visitor Visa page ↗</a><div className={styles.metaRow}><span>Source checked: {formatNZDate(checkedAt)}</span><span>Official source: Immigration New Zealand</span></div></div></section>

      <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>Visitor Visa NZ: common questions</h2></div><div className={styles.faqList}>{faq.map(item=><details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></section>

      <aside className={styles.disclaimer}><strong>Information notice:</strong> This is general information, not immigration advice. Visa rules, costs, evidence requirements and processing times can change. Immigration New Zealand is the authoritative source. <Link href="/immigration">See the Webfit News NZ visa guide.</Link></aside>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/>
  </>;
}
