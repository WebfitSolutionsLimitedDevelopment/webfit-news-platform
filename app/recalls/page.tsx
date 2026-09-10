import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import guideStyles from '@/components/UtilityGuide.module.css';
import RecallExplorer from './RecallExplorer';
import styles from './Recalls.module.css';
import {getNzRecalls} from '@/lib/nz-recalls';

export const metadata:Metadata={
  title:'NZ Recalls | Latest Food, Product, Baby, Electrical & Vehicle Recalls',
  description:'Search the latest New Zealand recalls from official Product Safety NZ and MPI food-recall sources. Check products, food, baby items, appliances, vehicles and more.',
  keywords:['nz recalls','product recalls nz','food recalls nz','baby product recalls nz','vehicle recalls nz','electrical recalls nz','latest recalls new zealand'],
  alternates:{canonical:'/recalls'},
  robots:{index:true,follow:true},
  openGraph:{title:'NZ Recall & Safety Centre | Webfit News',description:'Search recent New Zealand product and food recalls from official government sources.',url:'/recalls',type:'website'},
};

const faq:[string,string][]=[
  ['Where does Webfit News get recall information?','The Recall & Safety Centre reads current public recall information from Product Safety New Zealand and New Zealand Food Safety at the Ministry for Primary Industries. Each result links to the original official notice.'],
  ['Does this page contain every recall in New Zealand?','No. It combines the latest recall material successfully loaded from the official sources. Some recalls are managed by specialist regulators or may not appear in the currently loaded results, so the official databases remain the final reference.'],
  ['What should I do if I own a recalled product?','Open the official recall notice and follow the supplier or regulator instructions. Depending on the recall, you may be told to stop using the product, return it, dispose of it, arrange a repair or contact the supplier.'],
  ['Can I search for an old recall?','The search box filters the currently loaded recall results. For older or historical recalls, use the official Product Safety NZ or MPI recall databases linked on this page.'],
  ['How often is this page refreshed?','Webfit News refreshes the official source data periodically and currently caches successful source reads for up to 30 minutes to avoid unnecessary load on government websites.'],
];

export default async function RecallsPage(){
  const data=await getNzRecalls();
  const structuredData={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebApplication',name:'Webfit News NZ Recall & Safety Centre',url:'https://webfitnews.com/recalls',applicationCategory:'UtilityApplication',operatingSystem:'Web',description:metadata.description},
      {'@type':'FAQPage',mainEntity:faq.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))},
      {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},{'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},{'@type':'ListItem',position:3,name:'NZ Recalls',item:'https://webfitnews.com/recalls'}]},
    ],
  };

  return <>
    <SiteHeader/>
    <main className={`shell ${guideStyles.page}`}>
      <section className={guideStyles.hero}>
        <div>
          <span className={guideStyles.eyebrow}>Webfit News NZ Recall & Safety Centre</span>
          <h1>Check the latest New Zealand recalls</h1>
          <p className={guideStyles.lead}>Search recent product and food recalls loaded from official New Zealand government sources. Every result takes you back to the original recall notice so you can confirm the affected model, batch, date and action required.</p>
        </div>
        <div className={guideStyles.heroCard}>
          <span>Official-source evidence</span>
          <strong>Products + food in one place</strong>
          <small>No invented severity score. No “all clear” claim when a search returns nothing.</small>
        </div>
      </section>

      <section className={guideStyles.section}>
        <div className={guideStyles.sectionHeading}>
          <span className={guideStyles.kicker}>Live recall finder</span>
          <h2>Search current recall information</h2>
          <p>Try a brand, retailer, model, food name or product keyword. The results below are only the recall records successfully loaded from the official sources at this visit.</p>
        </div>
        <RecallExplorer products={data.products.items} food={data.food.items} productOk={data.products.ok} foodOk={data.food.ok}/>
        <div className={styles.note}><strong>Important:</strong> A missing search result does not prove a product is safe or has never been recalled. Check the official databases directly when the issue is safety-critical.</div>
      </section>

      <section className={guideStyles.section}>
        <div className={guideStyles.sectionHeading}><span className={guideStyles.kicker}>Useful categories</span><h2>What you can check</h2></div>
        <div className={guideStyles.infoGrid}>
          <article><h3>Baby & children’s products</h3><p>Toys, bottles, teethers, clothing, nursery items and other products where small parts, burns, choking or other hazards may trigger recalls.</p></article>
          <article><h3>Electrical & appliances</h3><p>Heaters, chargers, power banks, household appliances and electrical products recalled for overheating, fire, electric-shock or compliance risks.</p></article>
          <article><h3>Vehicles & automotive</h3><p>Vehicle, tyre, motorcycle and automotive-component recalls published through Product Safety NZ, with specialist NZTA recall services linked where appropriate.</p></article>
          <article><h3>Food & allergens</h3><p>Food recalls published by New Zealand Food Safety, including undeclared allergens, contamination, foreign matter and other food-safety issues.</p></article>
        </div>
      </section>

      <section className={guideStyles.section}>
        <div className={guideStyles.sectionHeading}><span className={guideStyles.kicker}>Official databases</span><h2>Check directly with the regulator</h2><p>These government pages remain the authoritative source for recall details and instructions.</p></div>
        <div className={styles.sourceLinks}>
          <a href={data.official.productSafety} target="_blank" rel="noopener noreferrer"><strong>Product Safety New Zealand ↗</strong><span>Consumer products, appliances, toys, vehicles and other general product recalls.</span></a>
          <a href={data.official.mpi} target="_blank" rel="noopener noreferrer"><strong>MPI / New Zealand Food Safety ↗</strong><span>Current and historical food recalls, including allergen and contamination notices.</span></a>
        </div>
      </section>

      <section className={guideStyles.section}>
        <div className={guideStyles.sectionHeading}><span className={guideStyles.kicker}>FAQs</span><h2>New Zealand recall questions</h2></div>
        <div className={guideStyles.infoGrid}>{faq.map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div>
      </section>

      <aside className={guideStyles.disclaimer}><strong>Safety note:</strong> Webfit News republishes and organises publicly available recall information for convenience. It does not replace the regulator, manufacturer, retailer, medical advice or emergency services. Always follow the original official notice for the affected product.</aside>
      <p><Link href="/nz-guides">← Back to NZ Guides</Link></p>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,'\\u003c')}}/>
  </>;
}
