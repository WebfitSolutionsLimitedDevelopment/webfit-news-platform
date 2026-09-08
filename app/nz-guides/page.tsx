import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';

export const metadata: Metadata = {
  title: 'New Zealand Guides | Wages, Holidays, Visas, Passports & Government Jobs',
  description: 'Practical New Zealand guides from Webfit News covering minimum wage, public holidays, visas, passport renewal and government jobs, with official government sources.',
  keywords: ['New Zealand guides','NZ information','minimum wage NZ','public holidays NZ','visitor visa NZ','NZ passport renewal','government jobs NZ'],
  alternates: { canonical: '/nz-guides' },
};

const guides=[
  {href:'/minimum-wage',title:'Minimum Wage NZ',text:'Current adult, starting-out and training minimum wage rates, pay examples and calculator.',fresh:'48-hour source checks'},
  {href:'/public-holidays',title:'Public Holidays NZ',text:'2026 and 2027 national holidays, anniversary days, observed dates and public holiday pay.',fresh:'30-day source checks'},
  {href:'/immigration',title:'New Zealand Visa Guide',text:'Work, study, visit, residence and family visa pathways with official Immigration New Zealand links.',fresh:'Live visa source monitoring'},
  {href:'/visitor-visa-nz',title:'Visitor Visa NZ',text:'Current Visitor Visa cost, processing time, stay length, requirements and application links.',fresh:'6-hour source checks'},
  {href:'/nz-passport-renewal',title:'NZ Passport Renewal',text:'Passport renewal cost, current processing times, photo rules and application requirements.',fresh:'7-day source checks'},
  {href:'/government-jobs-nz',title:'Government Jobs NZ',text:'Current Public Service vacancies, job categories, graduate programmes and official job links.',fresh:'3-hour vacancy checks'},
];

export default function NzGuidesPage(){
  const ld={'@context':'https://schema.org','@type':'CollectionPage',name:'New Zealand Guides',url:'https://www.webfitnews.com/nz-guides',hasPart:guides.map(g=>({'@type':'WebPage',name:g.title,url:`https://www.webfitnews.com${g.href}`}))};
  return <><SiteHeader/><main className={`shell ${styles.page}`}><section className={styles.hero}><div><span className={styles.eyebrow}>Webfit News NZ Guides</span><h1>Useful New Zealand information, kept current</h1><p className={styles.lead}>Practical guides people search for every day, organised clearly and linked back to official New Zealand government sources.</p></div><div className={styles.heroCard}><span>Evergreen information</span><strong>6 live guides</strong><small>Built to stay useful beyond the daily news cycle.</small></div></section><section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Browse guides</span><h2>New Zealand information guides</h2><p>Each guide shows its official sources and when those sources were last checked.</p></div><div className={styles.infoGrid}>{guides.map(g=><article key={g.href}><h3><Link href={g.href}>{g.title}</Link></h3><p>{g.text}</p><div className={styles.metaRow}><span>{g.fresh}</span></div><Link className={styles.cta} href={g.href}>Open guide →</Link></article>)}</div></section><aside className={styles.disclaimer}><strong>Source policy:</strong> Webfit News reorganises official public information for readability. Government agencies remain the authoritative source for laws, fees, eligibility, dates and application decisions.</aside></main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
