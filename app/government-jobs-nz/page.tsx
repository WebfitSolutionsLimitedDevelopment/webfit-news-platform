import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { getGovernmentJobsSnapshot,governmentJobsSources } from '@/lib/government-jobs';
import styles from '@/components/UtilityGuide.module.css';
export const revalidate=10800;
export const metadata:Metadata={
  title:'Government Jobs NZ 2026 | Current Public Service Vacancies',
  description:'Find current NZ government jobs from jobs.govt.nz, including Auckland, Wellington, IT, policy, administration and graduate Public Service vacancies.',
  keywords:['government jobs NZ','NZ government jobs','government vacancies NZ','public service jobs NZ','jobs govt nz','government jobs Auckland','government jobs Wellington','public sector jobs NZ'],
  alternates:{canonical:'/government-jobs-nz'},
  openGraph:{title:'Government Jobs NZ 2026 | Current Public Service Vacancies',description:'Search current New Zealand Government and Public Service jobs from official sources.',url:'/government-jobs-nz',type:'website'},
};
const fmt=(v:string)=>new Intl.DateTimeFormat('en-NZ',{day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Pacific/Auckland',timeZoneName:'short'}).format(new Date(v));
const categoryLinks=[['IT & computing','IT+%26+computing'],['Policy & analysis','Policy+%26+analysis'],['Administration','Administration'],['Legal & courts','Legal+%26+courts'],['Human resources','Human+resources%2C+recruitment+%26+training'],['Defence & security','Defence%2C+corrections+%26+security']];

export default async function Page(){
  const s=await getGovernmentJobsSnapshot();
  const faq=[
    {q:'Where can I find NZ government jobs?',a:'The central official vacancy portal is jobs.govt.nz. It lists Public Service and wider government-sector vacancies from agencies across New Zealand.'},
    {q:'Are there government jobs in Auckland?',a:'Yes. jobs.govt.nz currently lists hundreds of Auckland-tagged vacancies across agencies and sectors, although the exact count changes continuously.'},
    {q:'Are most New Zealand government jobs in Wellington?',a:'No. Wellington has many central-government roles, but jobs.govt.nz also lists vacancies in Auckland, Canterbury, Waikato, Bay of Plenty, Otago and other regions.'},
    {q:'Where can graduates find NZ government jobs?',a:'The Public Service Commission publishes graduate programmes and internships across policy, finance, IT, data, foreign affairs, primary industries and other career fields.'},
    {q:'Can migrants apply for NZ government jobs?',a:'It depends on the vacancy. Check the required right to work, citizenship or residency conditions, security clearance, qualifications and any agency-specific requirements before applying.'},
  ];
  const faqEntities=faq.map(item=>({'@type':'Question',name:item.q,acceptedAnswer:{'@type':'Answer',text:item.a}}));
  const graph:any[]=[
    {'@type':'WebPage',name:'Government Jobs NZ 2026',url:'https://webfitnews.com/government-jobs-nz',dateModified:s.checkedAt,description:metadata.description},
    {'@type':'FAQPage',mainEntity:faqEntities},
    {'@type':'BreadcrumbList',itemListElement:[
      {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
      {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
      {'@type':'ListItem',position:3,name:'Government Jobs NZ',item:'https://webfitnews.com/government-jobs-nz'},
    ]},
  ];
  if(s.jobs.length){graph.push({'@type':'ItemList',name:'Current NZ Government Jobs',itemListElement:s.jobs.map((j,i)=>({'@type':'ListItem',position:i+1,url:j.href,name:j.title}))});}
  const ld={'@context':'https://schema.org','@graph':graph};

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Government Job Search</span><h1>Government Jobs NZ 2026</h1><p className={styles.lead}>Search current New Zealand Government and Public Service vacancies, browse popular categories and find graduate and internship opportunities.</p><div className={styles.freshness}><span className={s.sourceOk?styles.liveDot:styles.fallbackDot}/><strong>Official jobs source checked:</strong> {fmt(s.checkedAt)}</div></div><div className={styles.heroCard}><span>Current official vacancy source</span><strong>{s.availableCount?s.availableCount:'Live jobs.govt.nz'}</strong><small>Vacancies change continuously. The complete current list is on jobs.govt.nz.</small></div></section>

    <nav className={styles.jumpNav}><span>Jump to:</span><a href="#latest">Current jobs</a><a href="#locations">Locations</a><a href="#categories">Categories</a><a href="#graduates">Graduates</a><a href="#faq">FAQs</a></nav>

    <section id="latest" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Current vacancies</span><h2>Latest NZ government jobs</h2><p>This shortlist comes from the official NZ Government Jobs source and refreshes every three hours. Use jobs.govt.nz for the full vacancy list and filters.</p></div>{s.jobs.length?<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Position</th><th>Location</th><th>Listed</th><th>Closing</th></tr></thead><tbody>{s.jobs.map(j=><tr key={j.href}><td><a className={styles.highlight} href={j.href} target="_blank" rel="noopener noreferrer">{j.title}</a></td><td>{j.location||'See vacancy'}</td><td>{j.listed||'—'}</td><td>{j.closing||'—'}</td></tr>)}</tbody></table></div>:<div className={styles.notice}>The official vacancy site responded, but its listing markup could not be safely parsed during this refresh. Use the official search for the live list.</div>}<a className={styles.cta} href="https://jobs.govt.nz/" target="_blank" rel="noopener noreferrer">Search all NZ Government jobs ↗</a></section>

    <section id="locations" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Jobs by location</span><h2>Government jobs in Auckland, Wellington and across NZ</h2></div><div className={styles.infoGrid}>
      <article><h3>Government jobs Auckland</h3><p>Current jobs.govt.nz results include roles in health, education, housing, transport, customs, police, corrections and other agencies across Auckland.</p><a className={styles.cta} href="https://jobs.govt.nz/jobtools/jncustomsearch.searchResults?in_jobDate=All&in_location=%22Auckland%22&in_organid=16563" target="_blank" rel="noopener noreferrer">Search Auckland government jobs ↗</a></article>
      <article><h3>Government jobs Wellington</h3><p>Wellington remains a major centre for policy, advisory, digital, regulatory, corporate and operational Public Service roles.</p><a className={styles.cta} href="https://jobs.govt.nz/" target="_blank" rel="noopener noreferrer">Search jobs.govt.nz ↗</a></article>
      <article><h3>Regional government jobs</h3><p>Government vacancies are advertised throughout New Zealand, including regional service delivery, health, education, conservation and operational roles.</p></article>
    </div></section>

    <section id="categories" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Government job categories</span><h2>Browse Public Service jobs by career area</h2></div><div className={styles.cardGrid}>{categoryLinks.map(([label,value])=><article className={styles.card} key={label}><h3>{label}</h3><p>Search current {label.toLowerCase()} vacancies across New Zealand government agencies.</p><a className={styles.cta} href={`https://jobs.govt.nz/jobtools/jncustomsearch.searchResults?in_jobDate=All&in_multi01=%22${value}%22&in_multi01_id=1802&in_organid=16563`} target="_blank" rel="noopener noreferrer">View {label.toLowerCase()} jobs ↗</a></article>)}</div></section>

    <section id="graduates" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Graduate jobs & internships</span><h2>Start a career in the NZ Public Service</h2><p>The Public Service Commission currently lists graduate and internship programmes in areas including policy, economics, finance, IT, data science, foreign affairs, education and primary industries.</p><a className={styles.cta} href="https://www.publicservice.govt.nz/working-in-public-service/joining-the-public-service/graduate-programmes-and-internships" target="_blank" rel="noopener noreferrer">See official graduate programmes & internships ↗</a></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Applying</span><h2>How to apply for a New Zealand government job</h2></div><div className={styles.cardGrid}><article className={styles.card}><h3>1. Open the vacancy</h3><p>Check the role, salary information where published, location and closing date.</p></article><article className={styles.card}><h3>2. Check eligibility</h3><p>Review work rights, security clearance, citizenship/residency, qualifications and experience requirements.</p></article><article className={styles.card}><h3>3. Apply to the agency</h3><p>Applications are handled by the recruiting government agency, not Webfit News.</p></article></div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>NZ Government jobs and Public Service sources</h2></div><div className={styles.sourceList}>{governmentJobsSources.map(x=><a key={x.url} href={x.url} target="_blank" rel="noopener noreferrer"><div><strong>{x.name}</strong><small>{x.primary?'Primary vacancy source':'Official career source'}</small></div><span>Open official page ↗</span></a>)}</div><div className={styles.metaRow}><span>Last checked: {fmt(s.checkedAt)}</span><span>{s.sourcesChecked} of {governmentJobsSources.length} official pages responded</span></div><p><Link className={styles.cta} href="/jobs-in-new-zealand">See all Jobs in New Zealand search options →</Link></p></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>Government jobs NZ questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Information notice:</strong> Webfit News is not a government recruitment agency. Vacancy details, eligibility, salary and closing dates are controlled by the recruiting agency and jobs.govt.nz.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
