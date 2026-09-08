import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';

export const metadata: Metadata = {
  title: 'New Zealand Guides | Wages, Tax, KiwiSaver, Student Loans, Leave, Holidays, Visas & Jobs',
  description: 'Practical New Zealand guides from Webfit News covering minimum wage, PAYE and tax, tax codes, KiwiSaver, student loan repayments, sick leave, annual leave and holiday pay, public and school holidays, visas, passports and jobs, with official government sources.',
  keywords: ['New Zealand guides','NZ information','minimum wage NZ','PAYE calculator NZ','NZ tax calculator','NZ tax code finder','KiwiSaver calculator NZ','student loan calculator NZ','sick leave calculator NZ','annual leave entitlement NZ','holiday pay calculator NZ','public holidays NZ','school holidays NZ','visitor visa NZ','NZ passport application','NZ passport renewal','jobs in New Zealand','government jobs NZ'],
  alternates: { canonical: '/nz-guides' },
  openGraph: {
    title: 'New Zealand Guides | Webfit News',
    description: 'Current New Zealand guides for wages, tax, tax codes, KiwiSaver, student loans, leave, holidays, visas, passports and jobs, organised around official government sources.',
    url: '/nz-guides',
    type: 'website',
  },
};

const guides=[
  {href:'/minimum-wage',title:'Minimum Wage NZ',text:'Current adult, starting-out and training minimum wage rates, pay examples and calculator.',fresh:'Regular official-source checks'},
  {href:'/nz-paye-calculator',title:'NZ PAYE & Tax Calculator',text:'Estimate income tax, ACC, KiwiSaver, student-loan deductions and take-home pay using current IRD settings.',fresh:'Interactive calculator · regular IRD source checks'},
  {href:'/nz-tax-code-finder',title:'NZ Tax Code Finder',text:'Find the likely IRD tax code for main income, secondary income, student loans and common M, ME, SB, S, SH, ST and SA situations.',fresh:'Interactive finder · regular IRD source checks'},
  {href:'/nz-kiwisaver-calculator',title:'NZ KiwiSaver Calculator',text:'Estimate employee contributions, employer contributions after ESCT, and the current government KiwiSaver contribution.',fresh:'Interactive calculator · regular IRD source checks'},
  {href:'/nz-student-loan-calculator',title:'NZ Student Loan Repayment Calculator',text:'Estimate student-loan deductions by pay period, compare main and secondary jobs, and model extra repayments.',fresh:'Interactive calculator · regular IRD source checks'},
  {href:'/nz-holiday-pay-calculator',title:'NZ Holiday Pay Calculator',text:'Estimate annual leave pay and public-holiday pay using current OWP, AWE and time-and-a-half rules.',fresh:'Interactive calculator · current Employment NZ rules'},
  {href:'/nz-leave-entitlement-calculator',title:'NZ Sick Leave & Annual Leave Calculator',text:'Check sick-leave eligibility, carry-over and the statutory four-week annual holiday entitlement.',fresh:'Interactive calculator · daily official-source checks'},
  {href:'/public-holidays',title:'Public Holidays NZ',text:'2026 and 2027 national holidays, anniversary days, observed dates and public holiday pay.',fresh:'Date-aware Past, Today and Upcoming status'},
  {href:'/school-holidays-nz',title:'School Holidays NZ',text:'2026 and 2027 school terms and holiday dates with live Current, Past and Upcoming status.',fresh:'Date-aware Ministry of Education calendar'},
  {href:'/immigration',title:'New Zealand Visa Guide',text:'Work, study, visit, residence and family visa pathways with official Immigration New Zealand links.',fresh:'Live visa source monitoring'},
  {href:'/visitor-visa-nz',title:'Visitor Visa NZ',text:'Current Visitor Visa cost, processing time, stay length, requirements and application links.',fresh:'Frequent Immigration NZ source checks'},
  {href:'/new-zealand-passport-application',title:'New Zealand Passport Application',text:'First passport, adult and child application requirements, current fees, processing times and official application links.',fresh:'Regular NZ Passports source checks'},
  {href:'/nz-passport-renewal',title:'NZ Passport Renewal',text:'Passport renewal cost, current processing times, photo rules and application requirements.',fresh:'Regular NZ Passports source checks'},
  {href:'/jobs-in-new-zealand',title:'Jobs in New Zealand',text:'Part-time, no-experience, remote, government and visa-related job-search pathways with official NZ guidance.',fresh:'Regular official job-source checks'},
  {href:'/government-jobs-nz',title:'Government Jobs NZ',text:'Current Public Service vacancies, job categories, graduate programmes and official job links.',fresh:'Frequent vacancy checks'},
];

export default function NzGuidesPage(){
  const ld={
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'CollectionPage',
        name:'New Zealand Guides',
        url:'https://www.webfitnews.com/nz-guides',
        description:metadata.description,
        isPartOf:{'@type':'WebSite',name:'Webfit News',url:'https://www.webfitnews.com'},
        hasPart:guides.map(g=>({'@type':'WebPage',name:g.title,url:`https://www.webfitnews.com${g.href}`})),
      },
      {
        '@type':'BreadcrumbList',
        itemListElement:[
          {'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},
          {'@type':'ListItem',position:2,name:'New Zealand Guides',item:'https://www.webfitnews.com/nz-guides'},
        ],
      },
    ],
  };

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Webfit News NZ Guides</span>
          <h1>Useful New Zealand information, kept current</h1>
          <p className={styles.lead}>Practical guides people search for every day, organised clearly and linked back to official New Zealand government sources.</p>
        </div>
        <div className={styles.heroCard}>
          <span>Evergreen information</span>
          <strong>15 live guides</strong>
          <small>Built to stay useful beyond the daily news cycle.</small>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Browse guides</span>
          <h2>New Zealand information guides</h2>
          <p>Each guide explains its official sources and how freshness is handled.</p>
        </div>
        <div className={styles.infoGrid}>
          {guides.map(g=><article key={g.href}>
            <h3><Link href={g.href}>{g.title}</Link></h3>
            <p>{g.text}</p>
            <div className={styles.metaRow}><span>{g.fresh}</span></div>
            <Link className={styles.cta} href={g.href}>Open guide →</Link>
          </article>)}
        </div>
      </section>

      <aside className={styles.disclaimer}><strong>Source policy:</strong> Webfit News reorganises official public information for readability. Government agencies remain the authoritative source for laws, fees, eligibility, dates and application decisions.</aside>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/>
  </>;
}
