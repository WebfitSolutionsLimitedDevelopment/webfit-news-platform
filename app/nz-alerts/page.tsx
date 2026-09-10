import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import guideStyles from '@/components/UtilityGuide.module.css';
import AlertExplorer from './AlertExplorer';
import {getNzAlerts} from '@/lib/nz-alerts';

export const metadata:Metadata={
  title:'NZ Alerts | Earthquakes, Severe Weather, Civil Defence & Volcano Status',
  description:'Check current New Zealand safety alerts from GeoNet, MetService and Civil Defence, including felt earthquakes, severe weather, emergency alerts and volcanic alert levels.',
  keywords:['nz alerts','civil defence alerts nz','earthquake nz','geonet earthquakes','severe weather warnings nz','volcanic alert level nz','emergency alerts new zealand'],
  alternates:{canonical:'/nz-alerts'},
  robots:{index:true,follow:true},
  openGraph:{title:'Live New Zealand Safety Dashboard | Webfit News',description:'Latest official NZ earthquake, severe weather, Civil Defence and volcanic alert information in one place.',url:'/nz-alerts',type:'website'},
};

const faq:[string,string][]=[
  ['What sources does this dashboard use?','Webfit News loads public information from GeoNet, MetService and the National Emergency Management Agency Alert Hub. Each alert links back to the official source.'],
  ['Is this an emergency warning service?','No. This dashboard is a public-information convenience tool. In an emergency, follow official Civil Defence, emergency-service, GeoNet and MetService instructions directly.'],
  ['Why might an alert not appear here?','A source can be temporarily unavailable, an alert may fall outside the feed currently loaded, or a specialist agency may publish information through another channel. A blank section must not be treated as an all clear.'],
  ['How often does the data refresh?','The official source data is cached for a short period, currently up to five minutes, to keep the page responsive while avoiding unnecessary load on government systems.'],
  ['What does a Volcanic Alert Level mean?','GeoNet assigns Volcanic Alert Levels to describe the current level of volcanic activity. Always open GeoNet for the current official explanation, hazards and aviation information.'],
];

export default async function NzAlertsPage(){
  const data=await getNzAlerts();
  const structuredData={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebApplication',name:'Webfit News Live New Zealand Safety Dashboard',url:'https://webfitnews.com/nz-alerts',applicationCategory:'UtilityApplication',operatingSystem:'Web',description:metadata.description},
      {'@type':'FAQPage',mainEntity:faq.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))},
      {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'NZ Alerts',item:'https://webfitnews.com/nz-alerts'}]},
    ],
  };
  return <>
    <SiteHeader/>
    <main className={`shell ${guideStyles.page}`}>
      <section className={guideStyles.hero}>
        <div>
          <span className={guideStyles.eyebrow}>Webfit News Live NZ Safety Dashboard</span>
          <h1>New Zealand alerts in one place</h1>
          <p className={guideStyles.lead}>Check recent felt earthquakes, current volcanic alert levels, severe weather warnings and Civil Defence emergency alerts using official New Zealand public data.</p>
        </div>
        <div className={guideStyles.heroCard}>
          <span>Official public sources</span>
          <strong>GeoNet + MetService + NEMA</strong>
          <small>Updated frequently. Every item links back to the official source for full instructions.</small>
        </div>
      </section>

      <section className={guideStyles.section}>
        <div className={guideStyles.sectionHeading}>
          <span className={guideStyles.kicker}>Current conditions</span>
          <h2>Live New Zealand safety information</h2>
          <p>Source status is shown separately. If a feed is unavailable, this page says so rather than presenting an empty feed as an all clear.</p>
        </div>
        <AlertExplorer earthquakes={data.earthquakes.items} weather={data.weather.items} emergency={data.emergency.items} volcanoes={data.volcanoes.items} sourceState={{earthquakes:data.earthquakes.ok,weather:data.weather.ok,emergency:data.emergency.ok,volcanoes:data.volcanoes.ok}}/>
      </section>

      <section className={guideStyles.section}>
        <div className={guideStyles.sectionHeading}><span className={guideStyles.kicker}>Official sources</span><h2>Always verify critical alerts directly</h2></div>
        <div className={guideStyles.infoGrid}>
          <article><h3>GeoNet</h3><p>Official New Zealand earthquake and volcano monitoring, including felt earthquakes and current volcanic alert levels.</p><a href={data.official.geonet} target="_blank" rel="noopener noreferrer">Open GeoNet ↗</a></article>
          <article><h3>MetService warnings</h3><p>Official severe weather watches and warnings for heavy rain, strong wind, snow, thunderstorms and other hazardous weather.</p><a href={data.official.metservice} target="_blank" rel="noopener noreferrer">Open MetService warnings ↗</a></article>
          <article><h3>Civil Defence / NEMA</h3><p>Official emergency information and national guidance from New Zealand's emergency management authorities.</p><a href={data.official.nema} target="_blank" rel="noopener noreferrer">Open Civil Defence ↗</a></article>
        </div>
      </section>

      <section className={guideStyles.section}>
        <div className={guideStyles.sectionHeading}><span className={guideStyles.kicker}>FAQs</span><h2>NZ alert dashboard questions</h2></div>
        <div className={guideStyles.infoGrid}>{faq.map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div>
      </section>

      <aside className={guideStyles.disclaimer}><strong>Emergency note:</strong> Webfit News does not issue emergency warnings and this page must not be your only source of safety information. If you are in immediate danger, call 111 and follow official instructions from Civil Defence, emergency services, GeoNet and MetService.</aside>
      <p><Link href="/nz-guides">← Back to NZ Guides</Link></p>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/>
  </>;
}
