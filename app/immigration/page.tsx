import Link from 'next/link';
import { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { visaDefinitions, VisaCategory } from '@/lib/immigration';
import styles from './Immigration.module.css';

const SITE_URL='https://webfitnews.com';
const PAGE_URL=`${SITE_URL}/immigration`;
export const metadata:Metadata={
  title:'New Zealand Immigration & Visa Guide 2026 | Work, Study, Visit & Residence',
  description:'New Zealand immigration and visa guide for 2026. Compare work, student, visitor, residence and family visas, requirements and official Immigration NZ sources.',
  keywords:['New Zealand immigration','immigration NZ','New Zealand visa','NZ visa','work visa NZ','student visa NZ','visitor visa NZ','residence visa NZ'],
  alternates:{canonical:'/immigration'},
  openGraph:{title:'New Zealand Immigration & Visa Guide 2026',description:'Compare current New Zealand work, study, visitor, residence and family visa pathways with official Immigration NZ sources.',url:'/immigration',siteName:'Webfit News',type:'website',locale:'en_NZ'},
  twitter:{card:'summary_large_image',title:'New Zealand Immigration & Visa Guide 2026',description:'Compare current NZ visa pathways, requirements and official sources.'},
};
const categories:Array<{name:VisaCategory;id:string;route:string;description:string}>=[
  {name:'Work',id:'work-visas',route:'/immigration/work-visas',description:'New Zealand work visas for employment, post-study work, seasonal work and other approved work purposes.'},
  {name:'Study',id:'study-visas',route:'/immigration/student-visas',description:'New Zealand student visas for international study, scholarships, exchange programmes and approved study pathways.'},
  {name:'Visit',id:'visit-visas',route:'/immigration/visitor-visas',description:'New Zealand visitor visas for holidays, family visits, medical treatment, transit and other temporary stays.'},
  {name:'Residence',id:'residence-visas',route:'/immigration/residence-visas',description:'New Zealand residence pathways for skilled workers, investors, entrepreneurs and qualifying humanitarian categories.'},
  {name:'Family',id:'family-visas',route:'/immigration/family-visas',description:'New Zealand partner, parent, child and other family visa pathways.'},
];
const popularSlugs=['accredited-employer-work-visa','fee-paying-student-visa','visitor-visa','post-study-work-visa','partner-of-a-new-zealander-work-visa','partner-of-a-new-zealander-resident-visa','skilled-migrant-category-resident-visa','straight-to-residence-visa','work-to-residence-visa','parent-resident-visa'];
const popularVisas=popularSlugs.map(slug=>visaDefinitions.find(visa=>visa.slug===slug)).filter((visa):visa is NonNullable<typeof visa>=>Boolean(visa));

export default function ImmigrationHubPage(){
  const structuredData={
    '@context':'https://schema.org','@type':'CollectionPage',name:'New Zealand Immigration & Visa Guide 2026',description:metadata.description,url:PAGE_URL,isPartOf:{'@type':'WebSite',name:'Webfit News',url:SITE_URL},about:{'@type':'Thing',name:'New Zealand immigration and visas'},mainEntity:{'@type':'ItemList',numberOfItems:visaDefinitions.length,itemListElement:visaDefinitions.map((visa,index)=>({'@type':'ListItem',position:index+1,name:visa.name,url:`${PAGE_URL}/${visa.slug}`}))},
  };
  return <><SiteHeader/><main id="top" className={`shell ${styles.page}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/>
    <section className={styles.hero}><span className={styles.eyebrow}>New Zealand Immigration Guide 2026</span><h1>New Zealand Immigration & Visa Guide</h1><p className={styles.heroLead}>Compare New Zealand visas for work, study, visiting, residence and family. Open the visa that matches your purpose to see current requirements, fees, processing information, official Immigration New Zealand sources and a downloadable checklist.</p><div className={styles.notice}><strong>Start with your purpose:</strong> work, study, visit, residence or family. This guide organises official public information; Immigration New Zealand makes all visa decisions.</div></section>

    <nav className={styles.jumpNav} aria-label="New Zealand visa guide sections"><span>Jump to:</span>{categories.map(category=><a key={category.id} href={`#${category.id}`}>{category.name} visas</a>)}<a href="#popular-nz-visas">Popular visas</a><Link href="/category/immigration">Immigration news</Link></nav>

    <section className={styles.introGrid} aria-label="Choose a New Zealand visa"><div><strong>Want to work in New Zealand?</strong><p>Compare AEWV, post-study, partner and other work visa pathways.</p><Link href="/immigration/work-visas">Compare NZ work visas →</Link></div><div><strong>Want to study in New Zealand?</strong><p>Compare fee-paying, scholarship, exchange and other student visa pathways.</p><Link href="/immigration/student-visas">Compare NZ student visas →</Link></div><div><strong>Want to visit New Zealand?</strong><p>Check visitor visa, family visit and other temporary-visit options.</p><Link href="/visitor-visa-nz">Check the New Zealand Visitor Visa →</Link></div></section>

    <section className={styles.sourcePanel} aria-labelledby="visa-category-guides"><span className={styles.sectionLabel}>Visa categories</span><h2 id="visa-category-guides">Choose a New Zealand visa by purpose</h2><p>Each category page compares visas with a similar purpose so you can narrow the options before opening an individual visa guide.</p><div className={styles.questions}>{categories.map(category=><Link key={category.route} className={styles.question} href={category.route}>{category.name==='Study'?'New Zealand student visas':`New Zealand ${category.name.toLowerCase()} visas`}</Link>)}</div></section>

    <section className={styles.sourcePanel} aria-labelledby="popular-nz-visas"><span className={styles.sectionLabel}>Popular visa searches</span><h2 id="popular-nz-visas">Popular New Zealand visas</h2><p>Direct links to commonly researched work, student, visitor, partner and residence pathways.</p><div className={styles.questions}>{popularVisas.map(visa=><Link key={visa.slug} className={styles.question} href={`/immigration/${visa.slug}`}>{visa.name}</Link>)}</div></section>

    {categories.map(category=>{const visas=visaDefinitions.filter(visa=>visa.category===category.name);if(!visas.length)return null;return <section key={category.id} id={category.id} className={styles.category}><div className={styles.categoryHeading}><div><span className={styles.sectionLabel}>{category.name}</span><h2>New Zealand {category.name==='Study'?'student':category.name.toLowerCase()} visas</h2><p>{category.description}</p><p><Link className={styles.openGuide} href={category.route}>Compare all {category.name==='Study'?'NZ student visas':`NZ ${category.name.toLowerCase()} visas`} →</Link></p></div><a className={styles.backTop} href="#top">Back to top ↑</a></div><div className={styles.tableWrap}><table className={styles.visaTable}><thead><tr><th>New Zealand visa</th><th>What it is generally for</th><th>Category</th><th>Visa guide</th><th>Checklist</th></tr></thead><tbody>{visas.map(visa=><tr key={visa.slug}><td data-label="Visa"><Link className={styles.visaName} href={`/immigration/${visa.slug}`}>{visa.name}</Link></td><td data-label="What it is generally for"><Link className={styles.summaryLink} href={`/immigration/${visa.slug}`}>{visa.summary}</Link></td><td data-label="Category"><span className={styles.categoryPill}>{visa.category}</span></td><td data-label="Guide"><Link className={styles.openGuide} href={`/immigration/${visa.slug}`}>Read {visa.name} requirements →</Link></td><td data-label="Checklist"><a className={styles.downloadGuide} href={`/immigration/${visa.slug}/checklist.pdf`}>Download checklist ↓</a></td></tr>)}</tbody></table></div></section>;})}

    <section className={styles.checklistPanel}><div><span className={styles.sectionLabel}>Visa application checklists</span><h2>Download a checklist for each NZ visa guide</h2><p>The PDF summarises the source snapshot used by the guide, including key facts, requirements, document information and the official Immigration New Zealand source link.</p></div><strong>Always verify the final application requirements with Immigration New Zealand.</strong></section>

    <section className={styles.newsPanel}><div><span className={styles.sectionLabel}>Immigration updates</span><h2>New Zealand immigration news and visa changes</h2><p>Read Webfit News coverage of Immigration New Zealand announcements, work rights, policy changes and visa settings.</p></div><Link className={styles.newsLink} href="/category/immigration">Read NZ Immigration News →</Link></section>

    <section className={styles.sourcePanel}><h2>Official New Zealand immigration information</h2><p>Webfit News reorganises publicly available Immigration New Zealand information into a simpler reference format. Individual visa guides link directly to the relevant official page and show the source-check time.</p></section>
    <div className={styles.disclaimer}><strong>Information notice:</strong> General information only, not immigration or legal advice and not an assessment of eligibility. Immigration New Zealand remains the authoritative source for visa requirements, fees, processing information and application instructions.</div>
  </main><PublicFooter/></>;
}
