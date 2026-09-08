import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader} from '@/components/SiteHeader';
import {PublicFooter} from '@/components/PublicFooter';
import styles from '@/components/UtilityGuide.module.css';
import RentIncreaseChecker from './RentIncreaseChecker';
import {getNzTenancySnapshot,nzTenancySources} from '@/lib/nz-tenancy';

export const revalidate=86400;

export const metadata:Metadata={
  title:'Rent Increase NZ 2026 | 12-Month Rule, 60-Day Notice, Bond & Tenancy Rights',
  description:'NZ rent increase rules for 2026: check the 12-month limit, 60-day written notice, bond maximum, tenancy notice periods and Healthy Homes requirements.',
  keywords:['rent increase NZ','NZ tenancy','rent increase notice NZ','tenant rights NZ','landlord rights NZ','bond NZ tenancy','tenancy notice period NZ','Healthy Homes NZ','Tenancy Services NZ'],
  alternates:{canonical:'/nz-tenancy-rent-guide'},
  openGraph:{title:'Rent Increase NZ 2026 | 12-Month Rule, Notice & Bond',description:'Check New Zealand rent increase timing, 60-day notice, bond limits and current periodic-tenancy notice periods.',url:'/nz-tenancy-rent-guide',type:'website'},
};

const faq:[string,string][]=[
  ['How often can rent be increased in New Zealand?','For a standard residential tenancy, rent generally cannot be increased within 12 months of the tenancy starting or within 12 months of the last rent increase taking effect.'],
  ['How much notice is required for a rent increase in NZ?','A landlord must generally give at least 60 days’ written notice for a standard residential tenancy. Boarding houses have different notice rules.'],
  ['Can a landlord increase rent during a fixed-term tenancy?','Only if the tenancy agreement allows a rent increase, and the statutory timing and notice rules are also met.'],
  ['How much bond can a landlord charge in New Zealand?','A general tenancy bond can be up to 4 weeks’ rent. Tenancy Services also allows a separate pet bond of up to 2 weeks’ rent where the statutory pet-bond rules apply.'],
  ['How quickly must a tenancy bond be lodged?','If the tenant pays the bond to the landlord, the landlord must lodge it digitally with Tenancy Services within 23 working days.'],
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
        url:'https://webfitnews.com/nz-tenancy-rent-guide',
        applicationCategory:'UtilityApplication',
        operatingSystem:'Web',
        description:metadata.description,
      },
      {
        '@type':'FAQPage',
        mainEntity,
      },
      {
        '@type':'BreadcrumbList',
        itemListElement:[
          {'@type':'ListItem',position:1,name:'Webfit News',item:'https://webfitnews.com'},
          {'@type':'ListItem',position:2,name:'NZ Guides',item:'https://webfitnews.com/nz-guides'},
          {'@type':'ListItem',position:3,name:'Rent Increase NZ & Tenancy Guide',item:'https://webfitnews.com/nz-tenancy-rent-guide'},
        ],
      },
    ],
  };

  return <>
    <SiteHeader/>
    <main className={`shell ${styles.page}`}>
      <section className={styles.hero}><div><span className={styles.eyebrow}>New Zealand Rent Increase Rules 2026</span><h1>Rent Increase NZ 2026: Rules, Notice & Bond</h1><p className={styles.lead}>Check whether a rent increase can take effect, how much written notice is required, bond limits, periodic-tenancy notice periods and Healthy Homes obligations.</p></div><div className={styles.heroCard}><span>Standard rent increase rule</span><strong>12 months</strong><small>Plus at least 60 days’ written notice for standard residential tenancies.</small></div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Quick answer</span><h2>NZ rent increase rules at a glance</h2><p>For a standard residential tenancy, rent generally cannot increase until <strong>12 months</strong> after the tenancy starts or the last increase took effect. Landlords generally need to give at least <strong>60 days’ written notice</strong>. A general tenancy bond can be up to <strong>4 weeks’ rent</strong>.</p></div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Rent increase checker</span><h2>Can my rent be increased now?</h2><p>Enter the tenancy or last-increase dates to check the standard 12-month interval, 60-day notice rule and fixed-term agreement condition.</p></div><RentIncreaseChecker/></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Rent increases</span><h2>How often can rent be increased in NZ?</h2></div><div className={styles.infoGrid}>
        <article><h3>12-month interval</h3><p>Rent cannot generally be increased within 12 months of the tenancy starting, or within 12 months of the date the last increase took effect.</p></article>
        <article><h3>60 days’ written notice</h3><p>The landlord must give written notice stating the new rent and the date it starts. That date must generally be at least 60 days after the notice is given.</p></article>
        <article><h3>Fixed-term tenancy</h3><p>During a fixed term, rent can only be increased if the tenancy agreement permits an increase, and the statutory timing rules still apply.</p></article>
        <article><h3>Market rent disputes</h3><p>A tenant can apply to the Tenancy Tribunal if the rent is substantially above market rent. Tenancy Services publishes market-rent data for comparison.</p></article>
      </div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Bond</span><h2>NZ tenancy bond limits and lodgement</h2></div><div className={styles.infoGrid}>
        <article><h3>General bond: up to 4 weeks</h3><p>A general bond can be up to 4 weeks’ rent. A receipt must be provided.</p></article>
        <article><h3>Lodge within 23 working days</h3><p>If the tenant pays the landlord, the bond must be lodged digitally with Tenancy Services within 23 working days.</p></article>
        <article><h3>Rent in advance</h3><p>Landlords cannot generally require more than 2 weeks’ rent in advance.</p></article>
        <article><h3>Pet bond</h3><p>Tenancy Services currently states a pet bond can be up to 2 weeks’ rent where the legal pet-bond provisions apply.</p></article>
      </div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Ending a tenancy</span><h2>NZ periodic tenancy notice periods</h2></div><div className={styles.infoGrid}>
        <article><h3>Tenant: 21 days</h3><p>A tenant currently gives at least 21 days’ written notice to end a periodic tenancy, unless a shorter period is agreed in writing.</p></article>
        <article><h3>Landlord: 90 days</h3><p>A landlord can generally end a periodic tenancy with 90 days’ written notice without giving a reason, provided the notice is not retaliatory.</p></article>
        <article><h3>Landlord: 42 days</h3><p>42 days can apply in specified cases, including owner or family occupation, qualifying employee housing, or an unconditional sale requiring vacant possession.</p></article>
        <article><h3>Fixed term</h3><p>A fixed-term tenancy normally runs to its agreed expiry date and generally cannot be ended early unless both parties agree or another specific legal ground applies.</p></article>
      </div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Healthy Homes</span><h2>Healthy Homes standards for NZ rentals</h2><p>All rental properties must comply with the Healthy Homes standards unless an exemption applies.</p></div><div className={styles.infoGrid}>
        <article><h3>Heating</h3><p>The main living room must meet the applicable fixed-heating requirements.</p></article>
        <article><h3>Insulation</h3><p>Ceiling and underfloor insulation requirements apply where required by the standards.</p></article>
        <article><h3>Ventilation</h3><p>Rental homes must meet ventilation requirements, including required extractor fans and openable windows where applicable.</p></article>
        <article><h3>Moisture & draughts</h3><p>The standards cover moisture ingress, drainage and unreasonable draughts. New, renewed or varied agreements must include the required compliance statement.</p></article>
      </div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>Official sources</span><h2>Official NZ tenancy and rent increase sources</h2><p>Last checked {checked}. {snapshot.reachable}/{snapshot.total} official source pages responded successfully.</p></div><div className={styles.infoGrid}>{nzTenancySources.map(s=><article key={s.url}><h3>{s.label}</h3><a href={s.url} target="_blank" rel="noreferrer">Open official source →</a></article>)}</div></section>

      <section className={styles.section}><div className={styles.sectionHeading}><span className={styles.kicker}>FAQs</span><h2>Rent increase and tenancy questions NZ</h2></div><div className={styles.infoGrid}>{faq.map(([q,a])=><article key={q}><h3>{q}</h3><p>{a}</p></article>)}</div></section>

      <aside className={styles.disclaimer}><strong>Important:</strong> This is general information, not legal advice. Boarding houses, social housing, service tenancies, agreed rent changes after substantial improvements, retaliatory notices and Tenancy Tribunal orders can follow different rules. Use Tenancy Services or professional advice for your specific situation.</aside>
      <p><Link href="/nz-guides">← Back to NZ Guides</Link></p>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/>
  </>;
}
