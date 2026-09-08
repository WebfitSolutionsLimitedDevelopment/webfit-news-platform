import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { getNzJobsSnapshot,nzJobsSources } from '@/lib/jobs-in-new-zealand';
import styles from '@/components/UtilityGuide.module.css';

export const revalidate=43200;

export const metadata:Metadata={
  title:'Jobs in New Zealand 2026 | Part-Time, No Experience, Remote & Visa Jobs',
  description:'Jobs in New Zealand guide covering part-time jobs, no-experience jobs, remote work, government jobs and visa-sponsorship pathways, with official NZ sources.',
  keywords:['jobs in New Zealand','jobs in NZ','part time jobs NZ','no experience jobs NZ','work from home jobs NZ','remote jobs NZ','visa sponsorship jobs NZ','Auckland jobs','Wellington jobs','government jobs NZ'],
  alternates:{canonical:'/jobs-in-new-zealand'},
  openGraph:{title:'Jobs in New Zealand 2026 | Webfit News',description:'Practical job-search routes for New Zealand, including part-time, entry-level, remote, government and accredited-employer pathways.',url:'/jobs-in-new-zealand',type:'website'},
};

const formatNz=(value:string)=>new Intl.DateTimeFormat('en-NZ',{day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'Pacific/Auckland',timeZoneName:'short'}).format(new Date(value));

export default async function Page(){
  const snapshot=await getNzJobsSnapshot();
  const faq=[
    {q:'Where should I look for jobs in New Zealand?',a:'Most people use employment websites, recruitment companies and direct employer applications. Official New Zealand guidance also points job seekers to Work and Income and Tahatū Career Navigator.'},
    {q:'How do I find part-time jobs in New Zealand?',a:'Use job-site filters for part-time or casual work, check Student Job Search if you are eligible, and search by location and hours. Part-time employment usually has regular guaranteed hours, unlike casual work.'},
    {q:'Can I get a New Zealand job with no experience?',a:'Entry-level, trainee, retail, hospitality, customer service, warehousing and seasonal roles may accept applicants with limited experience. Focus your CV on transferable skills, availability and reliability.'},
    {q:'How do I find visa sponsorship jobs in New Zealand?',a:'For roles linked to an Accredited Employer Work Visa, check whether the employer is accredited with Immigration New Zealand. Accreditation does not itself guarantee that a particular vacancy qualifies for a visa.'},
    {q:'Where can I find New Zealand government jobs?',a:'Use the official government jobs portal or Webfit News Government Jobs NZ guide, which links directly to current public-service vacancies.'},
  ];
  const ld={'@context':'https://schema.org','@graph':[
    {'@type':'WebPage',name:'Jobs in New Zealand 2026',url:'https://www.webfitnews.com/jobs-in-new-zealand',description:metadata.description,dateModified:snapshot.checkedAt},
    {'@type':'FAQPage',mainEntity:faq.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://www.webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'Jobs in New Zealand',item:'https://www.webfitnews.com/jobs-in-new-zealand'}]},
  ]};

  return <><SiteHeader/><main className={`shell ${styles.page}`}>
    <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Jobs Guide</span><h1>Jobs in New Zealand 2026</h1><p className={styles.lead}>A practical starting point for part-time jobs, entry-level work, remote roles, government vacancies and visa-related job searches in New Zealand.</p><div className={styles.freshness}><span className={snapshot.sourceOk?styles.liveDot:styles.fallbackDot}/><strong>Official sources checked:</strong> {formatNz(snapshot.checkedAt)} · {snapshot.sourcesChecked}/{snapshot.totalSources} reachable</div></div><div className={styles.heroCard}><span>Best starting point</span><strong>Search by job type + location</strong><small>Then verify the employer, employment terms and visa requirements before applying.</small></div></section>

    <nav className={styles.jumpNav}><span>Jump to:</span><a href="#paths">Job types</a><a href="#where">Where to search</a><a href="#visa">Visa jobs</a><a href="#rights">Your rights</a><a href="#faq">FAQs</a></nav>

    <section id="paths" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Popular searches</span><h2>Find the right New Zealand job pathway</h2></div><div className={styles.infoGrid}>
      <article><h3>Part-time jobs NZ</h3><p>Search for regular reduced-hour roles in retail, hospitality, administration, customer service, education support and other sectors. Use filters for part-time, location and hours.</p></article>
      <article><h3>No-experience jobs NZ</h3><p>Target entry-level, trainee and junior roles. Highlight transferable skills, reliability, communication, licences and availability rather than leaving your CV focused only on formal experience.</p></article>
      <article><h3>Work-from-home and remote jobs NZ</h3><p>Use remote or hybrid filters on major job sites. Check whether the employer is New Zealand-based, what location restrictions apply, and whether the role is employee or contractor work.</p></article>
      <article><h3>Government jobs NZ</h3><p>Public-service vacancies are listed on the official government jobs portal. Webfit News also maintains a dedicated guide with current public-sector search links.</p><Link className={styles.cta} href="/government-jobs-nz">Open Government Jobs NZ →</Link></article>
    </div></section>

    <section id="where" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Job search</span><h2>Where to look for jobs in New Zealand</h2><p>Official guidance from Immigration New Zealand and Work and Income recommends job websites, recruitment companies and direct employer contact.</p></div><div className={styles.cardGrid}>
      <article className={styles.card}><h3>General job sites</h3><p>Work and Income lists major New Zealand job sites including SEEK, Trade Me Jobs, Indeed and JOBSPACE, plus specialist options.</p><a className={styles.cta} href="https://www.workandincome.govt.nz/work/find-jobs/where-to-look-for-jobs.html" target="_blank" rel="noopener noreferrer">Official job-search list ↗</a></article>
      <article className={styles.card}><h3>Career planning and applications</h3><p>Tahatū Career Navigator provides current government guidance on finding roles, identifying strengths, CV preparation and applications.</p><a className={styles.cta} href="https://tahatu.govt.nz/work/looking-for-a-job/how-to-look-for-jobs" target="_blank" rel="noopener noreferrer">Open Tahatū ↗</a></article>
      <article className={styles.card}><h3>Government vacancies</h3><p>For ministries, departments and other public-service roles, start with the official New Zealand Government Jobs portal.</p><a className={styles.cta} href="https://jobs.govt.nz/" target="_blank" rel="noopener noreferrer">Open jobs.govt.nz ↗</a></article>
    </div></section>

    <section id="visa" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Migrant job seekers</span><h2>Visa sponsorship jobs in New Zealand</h2><p>Be careful with the phrase “visa sponsorship”. For the Accredited Employer Work Visa, the key question is whether the employer is accredited and whether the job and applicant meet Immigration New Zealand requirements.</p></div><div className={styles.infoGrid}>
      <article><h3>Check the employer</h3><p>Immigration New Zealand publishes an accredited employer search tool. The list is updated regularly and can be searched by company name or NZBN.</p><a className={styles.cta} href="https://www.immigration.govt.nz/work/requirements-for-work-visas/approved-employers/accredited-employer-list/" target="_blank" rel="noopener noreferrer">Check accredited employers ↗</a></article>
      <article><h3>Check the visa</h3><p>An AEWV generally requires a qualifying full-time job offer from an accredited employer. Visa eligibility depends on the role, applicant and current immigration settings.</p><a className={styles.cta} href="https://www.immigration.govt.nz/visas/accredited-employer-work-visa/" target="_blank" rel="noopener noreferrer">Official AEWV guide ↗</a></article>
      <article><h3>Use our immigration guide</h3><p>For work, visitor, study, residence and family pathways, use the Webfit News New Zealand visa guide.</p><Link className={styles.cta} href="/immigration">Open Immigration guide →</Link></article>
    </div></section>

    <section id="rights" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Employment basics</span><h2>Know your employment rights before accepting a job</h2></div><div className={styles.cardGrid}>
      <article className={styles.card}><h3>Written employment agreement</h3><p>Employees are entitled to a written employment agreement. Minimum legal rights cannot be signed away.</p></article>
      <article className={styles.card}><h3>Minimum wage</h3><p>Workers aged 16 and over are generally covered by New Zealand minimum-wage rules. Check the current rates before accepting an offer.</p><Link className={styles.cta} href="/minimum-wage">Current NZ minimum wage →</Link></article>
      <article className={styles.card}><h3>Part-time vs casual</h3><p>Part-time work usually has regular and guaranteed hours. Casual employment generally has no guaranteed ongoing pattern, although actual working arrangements matter.</p></article>
    </div></section>

    <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>New Zealand job-search sources</h2></div><div className={styles.sourceList}>{nzJobsSources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><div><strong>{source.name}</strong><small>Official New Zealand source</small></div><span>Open official page ↗</span></a>)}</div></section>

    <section id="faq" className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>Jobs in New Zealand: common questions</h2></div><div className={styles.faqList}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>

    <aside className={styles.disclaimer}><strong>Information notice:</strong> Webfit News does not act as an employer, recruiter or immigration adviser. Job availability, employer accreditation and visa settings can change; verify details with the employer and the relevant official agency before applying.</aside>
  </main><PublicFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/></>;
}
