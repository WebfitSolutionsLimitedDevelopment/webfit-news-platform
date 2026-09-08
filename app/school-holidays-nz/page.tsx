import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import SchoolTermTable from './SchoolTermTable';
import styles from '@/components/UtilityGuide.module.css';

export const metadata:Metadata={
  title:'School Holidays NZ 2026 & 2027 | Term Dates & Next School Break',
  description:'NZ school holidays and term dates for 2026 and 2027. Next break: 26 September to 11 October 2026. Official Ministry of Education dates and live status.',
  keywords:['school holidays NZ','NZ school holidays 2026','NZ school holidays 2027','school term dates NZ','next school holidays NZ','New Zealand school holidays','school terms NZ'],
  alternates:{canonical:'/school-holidays-nz'},
  openGraph:{title:'School Holidays NZ 2026 & 2027 | Term Dates & Next Break',description:'Official New Zealand school holiday and term dates with current, upcoming and past status.',url:'/school-holidays-nz',type:'website'},
};
const terms2026=[{label:'Term 1',start:'2026-01-26',end:'2026-04-02',detail:'Schools choose a start date between 26 January and 9 February.'},{label:'Term 2',start:'2026-04-20',end:'2026-07-03',detail:'Fixed dates.'},{label:'Term 3',start:'2026-07-20',end:'2026-09-25',detail:'Fixed dates.'},{label:'Term 4',start:'2026-10-12',end:'2026-12-18',detail:'Schools may finish earlier, but no later than 18 December.'}];
const holidays2026=[{label:'Term 1 holidays',start:'2026-04-03',end:'2026-04-19',detail:'Includes Good Friday, Easter Monday and Easter Tuesday school holiday.'},{label:'Term 2 holidays',start:'2026-07-04',end:'2026-07-19',detail:'Includes Matariki on 10 July.'},{label:'Term 3 holidays',start:'2026-09-26',end:'2026-10-11',detail:'Spring school holidays — 16 calendar days.'},{label:'Summer holidays',start:'2026-12-19',end:'2027-02-03',detail:'About 5–6 weeks; exact end depends on each school’s 2027 opening date.'}];
const terms2027=[{label:'Term 1',start:'2027-01-28',end:'2027-04-09',detail:'Schools choose a start date between 28 January and 3 February.'},{label:'Term 2',start:'2027-04-27',end:'2027-07-02',detail:'Fixed dates.'},{label:'Term 3',start:'2027-07-19',end:'2027-09-24',detail:'Fixed dates.'},{label:'Term 4',start:'2027-10-11',end:'2027-12-17',detail:'Schools may finish earlier, but no later than 17 December.'}];
const holidays2027=[{label:'Term 1 holidays',start:'2027-04-10',end:'2027-04-26',detail:'Includes observed Anzac Day on 26 April.'},{label:'Term 2 holidays',start:'2027-07-03',end:'2027-07-18',detail:'Winter school holidays.'},{label:'Term 3 holidays',start:'2027-09-25',end:'2027-10-10',detail:'Spring school holidays.'},{label:'Summer holidays',start:'2027-12-18',end:'2028-02-08',detail:'About 5–6 weeks; exact end depends on each school’s 2028 opening date.'}];

export default function SchoolHolidaysPage(){
  const faq=[
    {q:'When are the next school holidays in NZ in 2026?',a:'The next nationwide school holiday break is the Term 3 spring break from Saturday 26 September to Sunday 11 October 2026. Term 4 starts Monday 12 October.'},
    {q:'What are the 2026 NZ school holiday dates?',a:'The 2026 breaks are 3–19 April, 4–19 July, 26 September–11 October, and the summer holidays beginning no later than 19 December.'},
    {q:'When are the 2027 school holidays in New Zealand?',a:'The main 2027 breaks are 10–26 April, 3–18 July, 25 September–10 October, and summer holidays beginning no later than 18 December.'},
    {q:'When does Term 3 finish in 2026?',a:'Term 3 finishes on Friday 25 September 2026 for state and state-integrated schools, followed by the spring school holidays.'},
    {q:'Do all New Zealand schools have exactly the same term dates?',a:'No. Terms 2 and 3 are fixed, while schools have some flexibility over the start of Term 1 and end of Term 4. Teacher-only days, anniversary days and approved closures can also differ.'},
    {q:'Do private schools follow the Ministry school holiday dates?',a:'Not necessarily. Private schools have greater flexibility and can use different term and holiday dates, so families should check the individual school calendar.'},
  ];
  const faqEntities=faq.map(item=>({'@type':'Question',name:item.q,acceptedAnswer:{'@type':'Answer',text:item.a}}));
  const ld={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebPage',name:'School Holidays NZ 2026 & 2027',url:'https://webfitnews.com/school-holidays-nz',description:metadata.description},
      {'@type':'FAQPage',mainEntity:faqEntities},
      {'@type':'BreadcrumbList',itemListElement:[
        {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
        {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
        {'@type':'ListItem',position:3,name:'School Holidays NZ',item:'https://webfitnews.com/school-holidays-nz'},
      ]},
    ],
  };

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand School Holiday Calendar</span><h1>School Holidays NZ 2026 & 2027</h1><p className={styles.lead}>Check the next New Zealand school holidays plus every 2026 and 2027 term date, with live Past, Current and Upcoming status.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>Official source:</strong> Ministry of Education school terms and holidays</div></div><div className={styles.heroCard}><span>Next school holidays</span><strong>26 Sep – 11 Oct 2026</strong><small>Term 3 spring break. Term 4 starts Monday 12 October.</small></div></section>

    <nav className={styles.jumpNav}><span>Jump to:</span><a href="#next">Next holidays</a><a href="#2026">2026 dates</a><a href="#2027">2027 dates</a><a href="#differences">Why dates differ</a><a href="#faq">FAQs</a></nav>

    <section id="next" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Next break</span><h2>When are the next school holidays in NZ?</h2><p>The next nationwide break is <strong>Saturday 26 September to Sunday 11 October 2026</strong>. Term 4 begins Monday 12 October and runs until each school’s closing date, no later than Friday 18 December.</p></div></section>

    <section id="2026" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>2026 calendar</span><h2>NZ school term dates 2026</h2><p>State and state-integrated schools. Term 1 start and Term 4 finish can vary within the Ministry’s allowed windows.</p></div><SchoolTermTable rows={terms2026}/><div className={styles.sectionHeading}><h2>NZ school holiday dates 2026</h2></div><SchoolTermTable rows={holidays2026}/></section>

    <section id="2027" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>2027 calendar</span><h2>NZ school term dates 2027</h2><p>Term 1 starts between 28 January and 3 February. Terms 2 and 3 are fixed nationwide for state and state-integrated schools.</p></div><SchoolTermTable rows={terms2027}/><div className={styles.sectionHeading}><h2>NZ school holiday dates 2027</h2></div><SchoolTermTable rows={holidays2027}/></section>

    <section id="differences" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Check your school</span><h2>Why NZ school term dates can differ</h2></div><div className={styles.infoGrid}>
      <article><h3>Term 1 and Term 4 flexibility</h3><p>Schools can choose their opening date within the permitted Term 1 range and can finish Term 4 earlier if teaching-time requirements are met.</p></article>
      <article><h3>Teacher-only days</h3><p>Teacher-only days, local anniversary days, emergencies, lawful strikes and permitted closures can affect an individual school calendar.</p></article>
      <article><h3>Private schools</h3><p>Private schools have greater legislative flexibility and may use different term and holiday dates.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official Ministry source</span><h2>Confirm New Zealand school holiday dates</h2><p>The Ministry of Education remains the authoritative source, and your own school calendar is the final check for local teacher-only or closure days.</p><a className={styles.cta} href="https://www.education.govt.nz/term-dates-and-holidays" target="_blank" rel="noopener noreferrer">Open official Ministry school term dates ↗</a> <Link className={styles.cta} href="/public-holidays">Check NZ public holidays 2026 & 2027 →</Link></div></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>School holidays NZ questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Calendar notice:</strong> Always check your own school’s calendar before booking travel or childcare. Individual schools can have teacher-only days and other permitted closures not shown here.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
