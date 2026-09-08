import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import RentIncreaseChecker from './RentIncreaseChecker';
import {getNzTenancySnapshot,nzTenancySources} from '@/lib/nz-tenancy';

export const revalidate=86400;

export const metadata:Metadata={
  title:'NZ Tenancy & Rent Increase Guide 2026 | Bond, Notice & Tenant Rights',
  description:'Check NZ rent increase timing, bond limits, notice periods, Healthy Homes obligations and common tenancy rights using current Tenancy Services guidance.',
  keywords:['NZ tenancy','rent increase NZ','rent increase notice NZ','tenant rights NZ','landlord rights NZ','bond NZ tenancy','tenancy notice period NZ','Healthy Homes NZ','Tenancy Services NZ'],
  alternates:{canonical:'/nz-tenancy-rent-guide'},
  openGraph:{title:'NZ Tenancy & Rent Increase Guide 2026 | Webfit News',description:'Current New Zealand tenancy rules for rent increases, bonds, notice periods and Healthy Homes.',url:'/nz-tenancy-rent-guide',type:'website'},
};

const faq:[string,string][]=[
  ['How often can rent be increased in New Zealand?','For a standard residential tenancy, rent generally cannot be increased within 12 months of the tenancy starting or within 12 months of the last rent increase taking effect.'],
  ['How much notice is required for a rent increase?','A landlord must generally give at least 60 days’ written notice for a standard residential tenancy. Boarding houses have different notice rules.'],
  ['How much bond can a landlord charge?','A general tenancy bond can be up to 4 weeks’ rent. Tenancy Services also allows a separate pet bond of up to 2 weeks’ rent where the statutory pet-bond rules apply.'],
  ['How quickly must a bond be lodged?','If the tenant pays the bond to the landlord, the landlord must lodge it digitally with Tenancy Services within 23 working days.'],
  ['How much notice does a tenant give to end a periodic tenancy?','A tenant must currently give at least 21 days’ written notice unless the landlord agrees to a shorter period.'],
  ['How much notice can a landlord give to end a periodic tenancy?','A landlord can generally give 90 days’ written notice without a reason, or 42 days in certain specified situations such as owner/family occupation, employee housing or an unconditional sale requiring vacant possession.'],
];

export default async function NzTenancyPage(){
  const snapshot=await getNzTenancySnapshot();
  const checked=new Intl.DateTimeFormat('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}).format(new Date(snapshot.checkedAt));
  const mainEntity=faq.map(([q,a])=>({
    '@type':'Question',
    name:q,
    acceptedAnswer:{
      '@type':'Answer',
      text:a,
    },
  }));
  const ld={
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'WebApplication',
        name:'NZ Rent Increase Checker',
        url:'https://www.webfitnews.com/nz-tenancy-rent-guide',
        applicationCategory:'UtilityApplication',
        operatingSystem:'Web',
      },
      {
        '@type':'FAQPage',
        mainEntity,
      },
      {
        '@type':'BreadcrumbList',
        itemListElement:[
          {'@type':'ListItem',position:1,name:'Webfit News',item:'https://www.webfitnews.com'},
          {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://www.webfitnews.com/nz-guides'},
          {'@type':'ListItem',position:3,name:'NZ Tenancy & Rent Guide',item:'https://www.webfitnews.com/nz-tenancy-rent-guide'},
        ],
      },
    ],
  };

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}><div><span className={styles.eyebrow}>Webfit News NZ Guides</span><h1>NZ tenancy & rent increase guide</h1><p className={styles.lead}>Check common rent-increase timing rules, bond limits, notice periods and rental-property obligations before acting.</p></div><div className={styles.heroCard}><span>Standard rent increase rule</span><strong>12 months</strong><small>Plus at least 60 days’ written notice for standard residential tenancies.</small></div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Interactive tool</span><h2>Can the rent increase take effect on that date?</h2><p>Checks the standard 12-month interval, 60-day notice rule and fixed-term agreement condition.</p></div><RentIncreaseChecker/></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Rent increases</span><h2>The core rules</h2></div><div className={styles.infoGrid}>
        <article><h3>12-month interval</h3><p>Rent cannot generally be increased within 12 months of the tenancy starting, or within 12 months of the date the last increase took effect.</p></article>
        <article><h3>60 days’ notice</h3><p>The landlord must give written notice stating the new rent and the date it starts. That date must generally be at least 60 days after the notice is given.</p></article>
        <article><h3>Fixed-term tenancy</h3><p>During a fixed term, rent can only be increased if the tenancy agreement permits an increase, and the statutory timing rules still apply.</p></article>
        <article><h3>Market rent disputes</h3><p>A tenant can apply to the Tenancy Tribunal if the rent is substantially above market rent. Tenancy Services publishes market-rent data for comparison.</p></article>
      </div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Bond</span><h2>Bond and move-in costs</h2></div><div className={styles.infoGrid}>
        <article><h3>General bond</h3><p>A general bond can be up to 4 weeks’ rent. A receipt must be provided.</p></article>
        <article><h3>Lodgement</h3><p>If the tenant pays the landlord, the bond must be lodged digitally with Tenancy Services within 23 working days.</p></article>
        <article><h3>Rent in advance</h3><p>Landlords cannot generally require more than 2 weeks’ rent in advance.</p></article>
        <article><h3>Pet bond</h3><p>Tenancy Services currently states a pet bond can be up to 2 weeks’ rent where the legal pet-bond provisions apply.</p></article>
      </div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Ending a tenancy</span><h2>Current periodic-tenancy notice periods</h2></div><div className={styles.infoGrid}>
        <article><h3>Tenant: 21 days</h3><p>A tenant currently gives at least 21 days’ written notice to end a periodic tenancy, unless a shorter period is agreed in writing.</p></article>
        <article><h3>Landlord: 90 days</h3><p>A landlord can generally end a periodic tenancy with 90 days’ written notice without giving a reason, provided the notice is not retaliatory.</p></article>
        <article><h3>Landlord: 42 days</h3><p>42 days can apply in specified cases, including owner or family occupation, qualifying employee housing, or an unconditional sale requiring vacant possession.</p></article>
        <article><h3>Fixed term</h3><p>A fixed-term tenancy normally runs to its agreed expiry date and generally cannot be ended early unless both parties agree or another specific legal ground applies.</p></article>
      </div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Healthy Homes</span><h2>Minimum rental-property standards</h2><p>All rental properties must comply with the Healthy Homes standards unless an exemption applies.</p></div><div className={styles.infoGrid}>
        <article><h3>Heating</h3><p>The main living room must meet the applicable fixed-heating requirements.</p></article>
        <article><h3>Insulation</h3><p>Ceiling and underfloor insulation requirements apply where required by the standards.</p></article>
        <article><h3>Ventilation</h3><p>Rental homes must meet ventilation requirements, including required extractor fans and openable windows where applicable.</p></article>
        <article><h3>Moisture & draughts</h3><p>The standards cover moisture ingress, drainage and unreasonable draughts. New, renewed or varied agreements must include the required compliance statement.</p></article>
      </div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Checked against NZ tenancy sources</h2><p>Last checked {checked}. {snapshot.reachable}/{snapshot.total} official source pages responded successfully.</p></div><div className={styles.infoGrid}>{nzTenancySources.map(s=><article key={s.url}><h3>{s.label}</h3><a href={s.url} target="_blank" rel="noreferrer">Open official source →</a></article>)}</div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>NZ tenancy questions</h2></div><div className={styles.infoGrid}>{faq.map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></section>

      <aside className={styles.disclaimer}><strong>Important:</strong> This is general information, not legal advice. Boarding houses, social housing, service tenancies, agreed rent changes after substantial improvements, retaliatory notices and Tenancy Tribunal orders can follow different rules. Use Tenancy Services or professional advice for your specific situation.</aside>
      <p><Link href="/nz-guides">← Back to NZ Guides</Link></p>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/>
  </>;
}
