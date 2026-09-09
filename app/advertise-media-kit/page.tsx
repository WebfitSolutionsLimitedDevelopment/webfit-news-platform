import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import styles from './AdvertisingMediaKit.module.css';

export const metadata={
  title:'Advertise with Webfit News | Advertising & Media Kit NZ',
  description:'Advertise with Webfit News across website, social media and community-focused digital campaigns. Request rates, specifications and campaign availability.'
};

const audience=[
  ['9.4K','Facebook followers'],
  ['10K','Instagram followers'],
  ['1K+','YouTube subscribers'],
  ['500+','LinkedIn followers'],
  ['936','TikTok followers'],
  ['14.2K','Active website users, 13 Aug to 9 Sep 2026'],
];

const options=[
  ['Website advertising','Display placements across selected homepage, section and article positions, subject to availability and campaign fit.'],
  ['Social media campaigns','Promotional campaigns across Webfit News social channels, with format and channel mix agreed before launch.'],
  ['Sponsored content','Clearly labelled sponsored or partner content designed to inform readers while remaining separate from independent newsroom decisions.'],
  ['Community & event promotion','Campaign support for relevant New Zealand community, business and event initiatives across suitable digital channels.'],
];

export default function AdvertiseMediaKitPage(){
  return <>
    <SiteHeader/>
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>Webfit News Advertising</p>
        <h1>Start your advertising journey with Webfit News.</h1>
        <p className={styles.lead}>Connect your business, event or campaign with a growing New Zealand audience across Webfit News, social media and community-focused digital coverage.</p>
        <div className={styles.heroActions}>
          <a className={styles.primary} href="mailto:Sandy@WebfitNews.co.nz?subject=Advertising%20with%20Webfit%20News">Request rates & availability</a>
          <a className={styles.secondary} href="tel:0221299323">Call 022 129 9323</a>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Our digital audience</h2>
        <p className={styles.intro}>Webfit News reaches readers through its website and a growing cross-platform social presence.</p>
        <div className={styles.stats}>{audience.map(([value,label])=><div className={styles.stat} key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      </section>

      <section className={styles.section}>
        <h2>Advertising opportunities</h2>
        <p className={styles.intro}>We can shape a campaign around the channel, placement and audience that make sense for your objective. Final rates, specifications, timing and availability are confirmed before booking.</p>
        <div className={styles.cards}>{options.map(([title,copy])=><article className={styles.card} key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className={styles.section}>
        <h2>How it works</h2>
        <p className={styles.intro}>Send us the essentials and we will come back with the most suitable options.</p>
        <div className={styles.steps}>
          <div className={styles.step}><b>1. Tell us your goal</b><p>Share your business, campaign objective, target audience and preferred dates.</p></div>
          <div className={styles.step}><b>2. Choose the right format</b><p>We will discuss website, social, sponsored or community-focused options that fit.</p></div>
          <div className={styles.step}><b>3. Confirm specs & rates</b><p>Creative dimensions, deadlines, placement availability and commercial terms are agreed before launch.</p></div>
          <div className={styles.step}><b>4. Campaign goes live</b><p>Approved advertising is published in the agreed placement and clearly identified where required.</p></div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Coverage that matters locally</h2>
        <p className={styles.intro}>Webfit News covers New Zealand news, Auckland, politics, business, immigration, communities, India, world news, entertainment and sport. Campaign placement can be discussed around relevant reader contexts where appropriate.</p>
      </section>

      <section className={styles.contact}>
        <div><h2>Ready to advertise?</h2><p>Contact Sandy for current rates, specifications, campaign deadlines and placement availability.</p></div>
        <div className={styles.contactLinks}><a href="tel:0221299323">022 129 9323</a><a href="mailto:Sandy@WebfitNews.co.nz">Sandy@WebfitNews.co.nz</a></div>
      </section>

      <p className={styles.fine}>Webfit News maintains editorial independence. Advertising does not determine newsroom coverage or editorial decisions. Sponsored or paid material is identified where applicable.</p>
    </main>
    <PublicFooter/>
  </>;
}
