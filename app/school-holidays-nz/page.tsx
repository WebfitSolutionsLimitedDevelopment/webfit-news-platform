import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import SchoolTermTable from './SchoolTermTable';
import styles from '@/components/UtilityGuide.module.css';

export const metadata:Metadata={
  title:'School Holidays NZ 2026 & 2027 | New Zealand School Term Dates',
  description:'New Zealand school holidays and school term dates for 2026 and 2027, with date-aware status and official Ministry of Education guidance.',
  keywords:['school holidays NZ','NZ school holidays','school term dates NZ','New Zealand school holidays 2026','New Zealand school holidays 2027','school terms NZ'],
  alternates:{canonical:'/school-holidays-nz'},
  openGraph:{title:'School Holidays NZ 2026 & 2027 | Webfit News',description:'Current New Zealand school term and holiday dates with official Ministry of Education sources.',url:'/school-holidays-nz',type:'website'},
};

const terms2026=[
  {label:'Term 1',start:'2026-01-26',end:'2026-04-02',detail:'Schools choose a start date between 26 January and 9 February.'},
  {label:'Term 2',start:'2026-04-20',end:'2026-07-03',detail:'Fixed dates.'},
  {label:'Term 3',start:'2026-07-20',end:'2026-09-25',detail:'Fixed dates.'},
  {label:'Term 4',start:'2026-10-12',end:'2026-12-18',detail:'Schools may finish earlier, but no later than 18 December.'},
];
const holidays2026=[
  {label:'Term 1 holidays',start:'2026-04-03',end:'2026-04-19',detail:'Includes Good Friday, Easter Monday and Easter Tuesday school holiday.'},
  {label:'Term 2 holidays',start:'2026-07-04',end:'2026-07-19',detail:'Includes Matariki on 10 July.'},
  {label:'Term 3 holidays',start:'2026-09-26',end:'2026-10-11',detail:'Two-week spring break.'},
  {label:'Summer holidays',start:'2026-12-19',end:'2027-02-03',detail:'About 5–6 weeks; exact end depends on each school’s 2027 opening date.'},
];
const terms2027=[
  {label:'Term 1',start:'2027-01-28',end:'2027-04-09',detail:'Schools choose a start date between 28 January and 3 February.'},
  {label:'Term 2',start:'2027-04-27',end:'2027-07-02',detail:'Fixed dates.'},
  {label:'Term 3',start:'2027-07-19',end:'2027-09-24',detail:'Fixed dates.'},
  {label:'Term 4',start:'2027-10-11',end:'2027-12-17',detail:'Schools may finish earlier, but no later than 17 December.'},
];
const holidays2027=[
  {label:'Term 1 holidays',start:'2027-04-10',end:'2027-04-26',detail:'Includes observed Anzac Day on 26 April.'},
  {label:'Term 2 holidays',start:'2027-07-03',end:'2027-07-18',detail:'Two-week winter break.'},
  {label:'Term 3 holidays',start:'2027-09-25',end:'2027-10-10',detail:'Two-week spring break.'},
  {label:'Summer holidays',start:'2027-12-18',end:'2028-02-08',detail:'About 5–6 weeks; exact end depends on each school’s 2028 opening date.'},
];

export default function SchoolHolidaysPage(){
  const faq=[
    {q:'When are the 2026 school holidays in New Zealand?',a:'The main 2026 state-school holiday periods are 3–19 April, 4–19 July, 26 September–11 October, and the summer holiday beginning no later than 19 December.'},
    {q:'When does Term 3 finish in 2026?',a:'Term 3 finishes on Friday 25 September 2026 for state and state-integrated schools.'},
    {q:'Do all New Zealand schools have exactly the same term dates?',a:'No. Schools have some flexibility over the start of Term 1 and the end of Term 4. Teacher-only days, local anniversary days and approved closures can also create differences.'},
    {q:'Do private schools follow these dates?',a:'Not necessarily. Private schools have more flexibility and may use different term and holiday dates.'},
  ];
  const ld={'@context':'https://schema.org','@graph':[
    {'@type':'WebPage',name:'School Holidays NZ 2026 & 2027',url:'https://www.webfitnews.com/school-holidays-nz',description:metadata.description},
    {'@type':'FAQPage',mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://www.webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'School Holidays NZ',item:'https://www.webfitnews.com/school-holidays-nz'}]},
  ]};

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand School Calendar</span><h1>School Holidays NZ 2026 & 2027</h1><p className={styles.lead}>New Zealand school term dates and holiday periods, with live Past, Current and Upcoming status based on Auckland time.</p><div className={styles.freshness}><span className={styles.liveDot}/><strong>Source:</strong> Ministry of Education term dates and holidays</div></div><div className={styles.heroCard}><span>Right now</span><strong>Term and holiday status updates automatically</strong><small>Exact dates can still vary by school where the Ministry allows flexibility.</small></div></section>

    <nav className={styles.jumpNav}><span>Jump to:</span><a href="#2026">2026</a><a href="#2027">2027</a><a href="#differences">Why dates differ</a><a href="#faq">FAQs</a></nav>

    <section id="2026" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>2026 calendar</span><h2>New Zealand school term dates 2026</h2><p>For state and state-integrated schools. Term 1 start and Term 4 finish can vary by school within the Ministry’s allowed windows.</p></div><SchoolTermTable rows={terms2026}/><div className={styles.sectionHeading}><h2>2026 school holiday dates</h2></div><SchoolTermTable rows={holidays2026}/></section>

    <section id="2027" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>2027 calendar</span><h2>New Zealand school term dates 2027</h2><p>The Ministry changed the latest allowed Term 1 start date to 3 February 2027. Terms 2 and 3 are fixed.</p></div><SchoolTermTable rows={terms2027}/><div className={styles.sectionHeading}><h2>2027 school holiday dates</h2></div><SchoolTermTable rows={holidays2027}/></section>

    <section id="differences" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Important</span><h2>Why school holiday dates can differ</h2></div><div className={styles.infoGrid}>
      <article><h3>Term 1 and Term 4 flexibility</h3><p>Schools can choose their opening date within the permitted Term 1 range and can finish Term 4 earlier, provided they meet the required teaching time.</p></article>
      <article><h3>Teacher-only and approved closure days</h3><p>Teacher-only days, local anniversary days, emergencies, lawful strikes and some board-approved closures can affect an individual school calendar.</p></article>
      <article><h3>Private schools and early learning</h3><p>Private schools may use different dates. Early childhood services may follow school terms, but many full-time services remain open through school holidays.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official source</span><h2>Ministry of Education school term dates</h2><p>Webfit News has organised the Ministry’s published dates into a simpler calendar. The Ministry remains the authoritative source.</p><a className={styles.cta} href="https://www.education.govt.nz/term-dates-and-holidays" target="_blank" rel="noopener noreferrer">Open Ministry of Education term dates ↗</a> <Link className={styles.cta} href="/public-holidays">See Public Holidays NZ →</Link></div></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>School holidays NZ: common questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Calendar notice:</strong> Always check your own school’s calendar before booking travel or childcare. Individual schools can have teacher-only days and other permitted closures that are not shown here.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
