import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { getPublicHolidaySnapshot, publicHolidaySources } from '@/lib/public-holidays';
import { NationalHolidayTable, AnniversaryTable } from './HolidayStatusTable';
import styles from '@/components/UtilityGuide.module.css';

export const revalidate = 2592000;

export const metadata: Metadata = {
  title: 'Public Holidays NZ 2026 & 2027 | New Zealand Public Holiday Dates',
  description: 'New Zealand public holidays for 2026 and 2027, including observed dates, regional anniversary days, Matariki, Easter, Christmas and public holiday pay rules.',
  keywords: ['public holidays nz','NZ public holidays','New Zealand public holidays','public holidays NZ 2026','public holidays NZ 2027','NZ holiday dates','Auckland anniversary day','Matariki public holiday','public holiday pay NZ'],
  alternates: { canonical: '/public-holidays' },
  openGraph: { title: 'Public Holidays NZ 2026 & 2027', description: 'A clean, current guide to New Zealand public holidays, observed dates and regional anniversary days.', url: '/public-holidays', type: 'website' },
};

function formatNZDate(value: string) {
  return new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Pacific/Auckland', timeZoneName: 'short' }).format(new Date(value));
}

export default async function PublicHolidaysPage() {
  const snapshot = await getPublicHolidaySnapshot();
  const faq = [
    { q: 'How many public holidays are there in New Zealand?', a: 'There are 12 public holidays each year, including the relevant provincial anniversary day.' },
    { q: 'Do I get paid if I do not work on a public holiday?', a: 'If the public holiday falls on a day you would otherwise usually work, you are generally entitled to be paid for the day under the current holiday rules.' },
    { q: 'What happens if I work on a public holiday in NZ?', a: 'Employees who work on a public holiday must generally be paid at least time and a half for the hours worked. If it is an otherwise working day, they are generally also entitled to an alternative holiday.' },
    { q: 'What does Mondayised mean?', a: 'Some public holidays that fall on a Saturday or Sunday are observed on the following Monday or Tuesday for employees who would not normally work the weekend day.' },
    { q: 'Is Matariki a public holiday in New Zealand?', a: 'Yes. Matariki is a national public holiday. It falls on Friday 10 July in 2026 and Friday 25 June in 2027.' },
  ];
  const jsonLd = { '@context':'https://schema.org', '@graph':[ { '@type':'WebPage', name:'Public Holidays NZ 2026 & 2027', url:'https://www.webfitnews.com/public-holidays', description:metadata.description, dateModified:snapshot.checkedAt, isPartOf:{'@type':'WebSite',name:'Webfit News',url:'https://www.webfitnews.com'} }, { '@type':'FAQPage', mainEntity:faq.map(item=>({'@type':'Question',name:item.q,acceptedAnswer:{'@type':'Answer',text:item.a}})) } ] };

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        <div><span className={styles.eyebrow}>New Zealand Calendar Guide</span><h1>Public Holidays NZ 2026 & 2027</h1><p className={styles.lead}>National public holiday dates, observed days, regional anniversary dates and the practical pay rules New Zealand workers search for most.</p><div className={styles.freshness}><span className={snapshot.sourceStatus==='live'?styles.liveDot:styles.fallbackDot}/><strong>Official sources checked:</strong> {formatNZDate(snapshot.checkedAt)}</div></div>
        <div className={styles.heroCard}><span>Live calendar status</span><strong>Past · Today · Upcoming</strong><small>The status labels update automatically using New Zealand time, so the page stays useful throughout the year.</small></div>
      </section>

      <nav className={styles.jumpNav} aria-label="Public holiday sections"><span>Jump to:</span><a href="#2026">2026 dates</a><a href="#2027">2027 dates</a><a href="#anniversary">Anniversary days</a><a href="#pay">Holiday pay</a><a href="#sources">Official sources</a><a href="#faq">FAQs</a></nav>

      {[2026,2027].map(year=><section key={year} id={String(year)} className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>National dates</span><h2>NZ public holidays {year}</h2><p>Past holidays are visually de-emphasised, today is highlighted, and future dates are marked upcoming. Observed dates are used for status where Mondayisation or Tuesdayisation applies.</p></div>
        <NationalHolidayTable year={year} holidays={snapshot.years[year]}/>
      </section>)}

      <section id="anniversary" className={styles.section}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>Regional holidays</span><h2>Regional anniversary days</h2><p>Anniversary days vary by region. The tables below also show whether each regional holiday has passed or is still upcoming.</p></div>
        <div className={styles.infoGrid}><div><h3>2026 anniversary days</h3><AnniversaryTable year={2026} items={snapshot.anniversaries[2026]}/></div><div><h3>2027 anniversary days</h3><AnniversaryTable year={2027} items={snapshot.anniversaries[2027]}/></div></div>
      </section>

      <section id="pay" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Work and pay</span><h2>Public holiday pay in New Zealand</h2></div><div className={styles.cardGrid}><article className={styles.card}><h3>If you normally work that day</h3><p>If you do not work because it is a public holiday and it would otherwise be a working day, you are generally entitled to be paid for the day.</p></article><article className={styles.card}><h3>If you work the public holiday</h3><p>You must generally receive at least time and a half for the hours worked.</p></article><article className={styles.card}><h3>Alternative holiday</h3><p>If the public holiday is an otherwise working day and you work it, you are generally also entitled to a paid alternative holiday.</p></article></div><div className={styles.notice} style={{marginTop:16}}><strong>Important:</strong> Employment New Zealand says the current Holidays Act rules continue to apply until the Employment Leave Act changes take effect in 2028.</div></section>

      <section id="sources" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Where this public holiday information comes from</h2><p>Webfit News checks official New Zealand government sources and presents the dates in a simpler calendar format. Government pages remain the authoritative source.</p></div><div className={styles.sourceList}>{publicHolidaySources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><div><strong>{source.name}</strong><small>{source.primary?'Primary calendar source':'Official cross-check'}</small></div><span>Open official page ↗</span></a>)}</div><div className={styles.metaRow}><span>Last checked: {formatNZDate(snapshot.checkedAt)}</span><span>{snapshot.sourcesChecked} of {publicHolidaySources.length} official pages responded</span></div></section>

      <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>Public holidays NZ: common questions</h2></div><div className={styles.faqList}>{faq.map(item=><details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></section>
      <aside className={styles.disclaimer}><strong>Information notice:</strong> This page is general information only. Public holiday and pay entitlements can depend on your work pattern and employment agreement. Always check the linked government sources for your circumstances.</aside>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/>
  </>;
}
