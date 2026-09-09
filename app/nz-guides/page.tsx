import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import {NZ_GUIDE_SITE_URL,nzGuideCategories,nzGuides} from '@/lib/nz-guide-catalog';

export const metadata:Metadata={
  title:'New Zealand Calculators & Guides 2026 | Tax, Pay, ACC, Visas, Holidays & Jobs',
  description:'Free New Zealand calculators and practical 2026 guides for PAYE, minimum wage, ACC, KiwiSaver, student loans, NZ Super, rates rebates, tenancy, holidays, visas, passports and jobs, checked against official NZ sources.',
  keywords:['New Zealand calculators','NZ calculators','NZ guides 2026','PAYE calculator NZ','minimum wage NZ','ACC levy calculator NZ','KiwiSaver calculator NZ','student loan calculator NZ','rates rebate calculator NZ','public holidays NZ','school holidays NZ','immigration NZ','NZ citizenship','NZ passport','jobs in New Zealand'],
  alternates:{canonical:'/nz-guides'},
  openGraph:{
    title:'New Zealand Calculators & Guides 2026 | Webfit News',
    description:'Practical NZ calculators and guides for money, work, housing, immigration, holidays and jobs, built around official government sources.',
    url:'/nz-guides',
    type:'website',
  },
};

export default function NzGuidesPage(){
  const itemList=nzGuides.map((guide,index)=>({
    '@type':'ListItem',
    position:index+1,
    name:guide.title,
    url:`${NZ_GUIDE_SITE_URL}${guide.href}`,
  }));

  const structuredData={
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'CollectionPage',
        name:'New Zealand Calculators and Guides 2026',
        url:`${NZ_GUIDE_SITE_URL}/nz-guides`,
        description:metadata.description,
        isPartOf:{'@type':'WebSite',name:'Webfit News',url:NZ_GUIDE_SITE_URL},
        publisher:{'@type':'NewsMediaOrganization',name:'Webfit News',url:NZ_GUIDE_SITE_URL},
        about:[
          {'@type':'Thing',name:'New Zealand tax and personal finance'},
          {'@type':'Thing',name:'New Zealand employment rights'},
          {'@type':'Thing',name:'New Zealand immigration and citizenship'},
          {'@type':'Thing',name:'New Zealand housing and household costs'},
          {'@type':'Thing',name:'New Zealand public and school holidays'},
        ],
      },
      {'@type':'ItemList',name:'Webfit News New Zealand Guides',itemListElement:itemList},
      {
        '@type':'BreadcrumbList',
        itemListElement:[
          {'@type':'ListItem',position:1,name:'Webfit News',item:NZ_GUIDE_SITE_URL},
          {'@type':'ListItem',position:2,name:'New Zealand Guides',item:`${NZ_GUIDE_SITE_URL}/nz-guides`},
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
          <h1>New Zealand calculators & guides 2026</h1>
          <p className={styles.lead}>Free, practical New Zealand calculators and guides for tax, wages, ACC, KiwiSaver, leave, rates, tenancy, immigration, citizenship, passports, holidays and jobs. Each guide is written for a specific search question and points back to the relevant official New Zealand source.</p>
        </div>
        <div className={styles.heroCard}>
          <span>NZ utility library</span>
          <strong>{nzGuides.length} live guides</strong>
          <small>Grouped by topic so readers can move naturally between related New Zealand information.</small>
        </div>
      </section>

      <nav className={styles.jumpNav} aria-label="New Zealand guide categories">
        <span>Browse:</span>
        {nzGuideCategories.map(category=><a key={category} href={`#${category.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}>{category}</a>)}
        <a href="#standards">Source standards</a>
      </nav>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Popular searches</span>
          <h2>Start with the most-used New Zealand calculators</h2>
          <p>These pages answer common high-intent searches such as “PAYE calculator NZ”, “minimum wage NZ”, “rates rebate calculator NZ”, “public holidays NZ” and “immigration NZ”.</p>
        </div>
        <div className={styles.infoGrid}>
          {['/nz-paye-calculator','/minimum-wage','/nz-rates-rebate-calculator','/public-holidays','/immigration','/nz-citizenship'].map(href=>{
            const guide=nzGuides.find(item=>item.href===href)!;
            return <article key={guide.href}>
              <h3><Link href={guide.href}>{guide.title}</Link></h3>
              <p>{guide.description}</p>
              <div className={styles.metaRow}><span>{guide.fresh}</span></div>
              <Link className={styles.cta} href={guide.href}>Open {guide.shortTitle} →</Link>
            </article>;
          })}
        </div>
      </section>

      {nzGuideCategories.map(category=>{
        const guides=nzGuides.filter(guide=>guide.category===category);
        const id=category.toLowerCase().replace(/[^a-z0-9]+/g,'-');
        return <section id={id} className={styles.section} key={category}>
          <div className={styles.sectionHeading}>
            <span className={styles.kicker}>NZ Guides</span>
            <h2>{category}</h2>
            <p>{category==='Money & tax'?'New Zealand tax, PAYE, ACC, KiwiSaver, student-loan, retirement and rebate tools.':category==='Work & employment'?'New Zealand wage, holiday-pay, sick-leave and annual-leave guidance.':category==='Housing & household costs'?'New Zealand rates-rebate, tenancy, rent-increase, bond and household-cost guidance.':category==='Immigration & citizenship'?'New Zealand visa, immigration, citizenship and passport guides with official application links.':category==='Holidays & family'?'Current New Zealand public-holiday and school-holiday dates with practical leave guidance.':'New Zealand job-search and Public Service vacancy guidance.'}</p>
          </div>
          <div className={styles.infoGrid}>
            {guides.map(guide=><article key={guide.href}>
              <h3><Link href={guide.href}>{guide.title}</Link></h3>
              <p>{guide.description}</p>
              <div className={styles.metaRow}><span>{guide.fresh}</span></div>
              <Link className={styles.cta} href={guide.href}>Open {guide.shortTitle} →</Link>
            </article>)}
          </div>
        </section>;
      })}

      <section id="standards" className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.kicker}>Source, trust & corrections</span>
          <h2>How Webfit News maintains its New Zealand guides</h2>
          <p>These pages reorganise official public information into calculators, tables, checklists and direct answers. Rates, fees, legal rules, visa settings and dates are linked back to the responsible New Zealand agency so readers can verify important decisions at the source.</p>
        </div>
        <div className={styles.infoGrid}>
          <article><h3>Official sources first</h3><p>Where a government agency publishes the underlying rule or rate, the guide links to that source and avoids treating third-party summaries as the authority.</p></article>
          <article><h3>Visible update signals</h3><p>Many guides show when official sources were last checked. We do not change dates merely to make a page look fresh.</p></article>
          <article><h3>Editorial accountability</h3><p>Webfit News publishes an editorial policy and corrections process, and is listed as a member of the New Zealand Media Council.</p><p><Link href="/editorial-policy">Read our Editorial Policy →</Link><br/><Link href="/corrections">Corrections & feedback →</Link><br/><a href="https://www.mediacouncil.org.nz/membership/" target="_blank" rel="noopener noreferrer">Verify Media Council membership ↗</a></p></article>
          <article><h3>General information, not official decisions</h3><p>Calculators are practical estimates. Government agencies, employers, councils and other responsible bodies remain the authority for individual eligibility, payroll, immigration, tenancy and legal decisions.</p></article>
        </div>
      </section>

      <aside className={styles.disclaimer}><strong>Source policy:</strong> Webfit News reorganises official New Zealand public information for readability and practical use. Always confirm important decisions on the linked government website.</aside>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/>
  </>;
}
