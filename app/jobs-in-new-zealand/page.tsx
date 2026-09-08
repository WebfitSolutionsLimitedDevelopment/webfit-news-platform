import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { getNzJobsSnapshot,nzJobsSources } from '@/lib/jobs-in-new-zealand';
import styles from '@/components/UtilityGuide.module.css';

export const revalidate=43200;
export const metadata:Metadata={
  title:'Jobs in New Zealand 2026 | Job Sites, No Experience & Visa Jobs',
  description:'Find jobs in New Zealand in 2026: best job sites, part-time and no-experience work, remote roles, government jobs and accredited-employer visa pathways.',
  keywords:['jobs in New Zealand','jobs NZ','New Zealand jobs','part time jobs NZ','no experience jobs NZ','visa sponsorship jobs NZ','accredited employer jobs NZ','remote jobs NZ','government jobs NZ'],
  alternates:{canonical:'/jobs-in-new-zealand'},
  openGraph:{title:'Jobs in New Zealand 2026 | Job Sites, Entry-Level & Visa Jobs',description:'Practical New Zealand job-search routes, official job sites and accredited-employer visa guidance.',url:'/jobs-in-new-zealand',type:'website'},
};
const formatNz=(value:string)=>new Intl.DateTimeFormat('en-NZ',{day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Pacific/Auckland',timeZoneName:'short'}).format(new Date(value));

export default async function Page(){
  const snapshot=await getNzJobsSnapshot();
  const faq=[
    {q:'What are the best websites to find jobs in New Zealand?',a:'Work and Income currently lists job-search options including MyMSD, SEEK, Trade Me Jobs, Indeed, JOBSPACE and specialist sites. Tahatū Career Navigator also provides government career and job-search guidance.'},
    {q:'Can I get a job in New Zealand with no experience?',a:'Yes, some entry-level, trainee, retail, hospitality, customer-service, warehousing and seasonal roles accept applicants with limited formal experience. Employers can still require licences, availability or role-specific skills.'},
    {q:'How do I find visa sponsorship jobs in New Zealand?',a:'For the common Accredited Employer Work Visa route, look for genuine full-time vacancies and verify the employer on Immigration New Zealand’s accredited employer list. The specific job must also have the required approval and meet visa rules.'},
    {q:'How many hours must an AEWV job offer provide?',a:'Immigration New Zealand says an Accredited Employer Work Visa job offer must be full-time and provide at least 30 hours of work a week.'},
    {q:'Can an employer charge me for an AEWV job offer?',a:'No. Immigration New Zealand says employers or agents cannot charge a migrant fees for a job or make the worker pay the employer’s recruitment costs. Job-offer scams are a known risk.'},
    {q:'Where can I find New Zealand government jobs?',a:'Use the official jobs.govt.nz portal or the Webfit News Government Jobs NZ guide, which points to current public-service vacancies.'},
  ];
  const faqEntities=faq.map(item=>({'@type':'Question',name:item.q,acceptedAnswer:{'@type':'Answer',text:item.a}}));
  const ld={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebPage',name:'Jobs in New Zealand 2026',url:'https://webfitnews.com/jobs-in-new-zealand',description:metadata.description,dateModified:snapshot.checkedAt},
      {'@type':'FAQPage',mainEntity:faqEntities},
      {'@type':'BreadcrumbList',itemListElement:[
        {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
        {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
        {'@type':'ListItem',position:3,name:'Jobs in New Zealand',item:'https://webfitnews.com/jobs-in-new-zealand'},
      ]},
    ],
  };

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Job Search Guide</span><h1>Jobs in New Zealand 2026</h1><p className={styles.lead}>Find the best places to search for New Zealand jobs, including part-time, no-experience, remote, government and accredited-employer roles.</p><div className={styles.freshness}><span className={snapshot.sourceOk?styles.liveDot:styles.fallbackDot}/><strong>Official sources checked:</strong> {formatNz(snapshot.checkedAt)} · {snapshot.sourcesChecked}/{snapshot.totalSources} reachable</div></div><div className={styles.heroCard}><span>Start here</span><strong>Search job sites → verify employer → apply</strong><small>If you need a work visa, verify the exact job and employer before paying anyone or making travel plans.</small></div></section>

    <nav className={styles.jumpNav}><span>Jump to:</span><a href="#sites">Job sites</a><a href="#paths">Popular jobs</a><a href="#visa">Visa jobs</a><a href="#rights">Rights</a><a href="#faq">FAQs</a></nav>

    <section id="sites" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Where to search</span><h2>Best places to find jobs in New Zealand</h2><p>Work and Income recommends searching by location or industry and currently lists major general and specialist job sites.</p></div><div className={styles.cardGrid}>
      <article className={styles.card}><h3>Work and Income job search</h3><p>Use MyMSD for job searches and matches, or the official Work and Income directory of New Zealand job websites.</p><a className={styles.cta} href="https://www.workandincome.govt.nz/work/find-jobs/where-to-look-for-jobs.html" target="_blank" rel="noopener noreferrer">See official job-search sites ↗</a></article>
      <article className={styles.card}><h3>SEEK, Trade Me & Indeed</h3><p>These are among the general job sites currently listed by Work and Income. Search by role, location, work type and keywords.</p></article>
      <article className={styles.card}><h3>Tahatū Career Navigator</h3><p>Government career guidance for identifying skills, exploring careers and preparing job applications.</p><a className={styles.cta} href="https://tahatu.govt.nz/work/looking-for-a-job/how-to-look-for-jobs" target="_blank" rel="noopener noreferrer">Open Tahatū ↗</a></article>
      <article className={styles.card}><h3>Government Jobs NZ</h3><p>For public-service vacancies, use jobs.govt.nz or the dedicated Webfit News government-jobs guide.</p><Link className={styles.cta} href="/government-jobs-nz">Find NZ government jobs →</Link></article>
    </div></section>

    <section id="paths" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Popular job searches</span><h2>Part-time, no-experience and remote jobs NZ</h2></div><div className={styles.infoGrid}>
      <article><h3>Part-time jobs NZ</h3><p>Use part-time and location filters for regular reduced-hour work. Students may also be eligible to use Student Job Search.</p></article>
      <article><h3>No-experience jobs NZ</h3><p>Search “entry level”, “trainee”, “junior” and “no experience required”. Focus your CV on transferable skills, reliability, availability and licences.</p></article>
      <article><h3>Remote jobs NZ</h3><p>Search remote or hybrid filters and confirm whether the role is employee or contractor work and whether the employer imposes location restrictions.</p></article>
      <article><h3>Seasonal jobs NZ</h3><p>Work and Income highlights seasonal work as a dedicated job-search category, including roles around New Zealand.</p></article>
    </div></section>

    <section id="visa" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Jobs with a work visa pathway</span><h2>How to find accredited employer and “visa sponsorship” jobs</h2><p>In New Zealand, “visa sponsorship” is often used informally. For the AEWV route, the actual requirements include a genuine full-time job offer from an accredited employer and an approved job check for that role.</p></div><div className={styles.infoGrid}>
      <article><h3>1. Verify the employer</h3><p>Immigration New Zealand’s accredited employer list is updated daily. Search by company/trading name or NZBN.</p><a className={styles.cta} href="https://www.immigration.govt.nz/work/requirements-for-work-visas/approved-employers/accredited-employer-list/" target="_blank" rel="noopener noreferrer">Check an accredited employer ↗</a></article>
      <article><h3>2. Check the job offer</h3><p>An AEWV offer must be full-time, at least 30 hours a week, current when you apply, and meet the applicable job, pay and employment-law requirements.</p></article>
      <article><h3>3. Never buy a job offer</h3><p>Immigration New Zealand says employers or agents cannot charge you for a job or pass recruitment costs to you. Treat requests for payment for a job offer as a major warning sign.</p></article>
      <article><h3>4. Check the visa itself</h3><p>The AEWV currently costs from $1,540, can allow up to five years depending on the job, and 80% are processed within eight weeks.</p><a className={styles.cta} href="https://www.immigration.govt.nz/visas/accredited-employer-work-visa/" target="_blank" rel="noopener noreferrer">Check official AEWV requirements ↗</a></article>
    </div></section>

    <section id="rights" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Before accepting a job</span><h2>Know your New Zealand employment rights</h2></div><div className={styles.cardGrid}>
      <article className={styles.card}><h3>Written employment agreement</h3><p>Employees are entitled to a written employment agreement and minimum employment rights cannot simply be signed away.</p></article>
      <article className={styles.card}><h3>Minimum wage</h3><p>Check the current legal minimum before accepting an offer.</p><Link className={styles.cta} href="/minimum-wage">Check Minimum Wage NZ 2026 →</Link></article>
      <article className={styles.card}><h3>Migrant workers have rights</h3><p>Immigration New Zealand states migrant workers have the same minimum employment rights as New Zealand workers.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>New Zealand job and immigration sources</h2></div><div className={styles.sourceList}>{nzJobsSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><div><strong>{source.name}</strong><small>Official New Zealand source</small></div><span>Open official page ↗</span></a>)}</div></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>Jobs in New Zealand questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Information notice:</strong> Webfit News does not act as an employer, recruiter or immigration adviser. Job availability, employer accreditation and visa settings can change; verify details with the employer and the relevant official agency before applying.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
