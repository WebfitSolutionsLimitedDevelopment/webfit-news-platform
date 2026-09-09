import Link from 'next/link';
import styles from './AdvertisingJourneyPromo.module.css';

const stats=[
  ['9.4K','Facebook followers'],
  ['10K','Instagram followers'],
  ['1K+','YouTube subscribers'],
  ['500+','LinkedIn followers'],
  ['936','TikTok followers'],
  ['14.2K','Active website users*'],
];

export function AdvertisingJourneyPromo(){
  return <section className={styles.wrap} aria-labelledby="advertising-journey-title">
    <div className={styles.top}>
      <div>
        <p className={styles.eyebrow}>Advertise with Webfit News</p>
        <h2 id="advertising-journey-title" className={styles.title}>Put your business in front of our growing New Zealand audience.</h2>
        <p className={styles.copy}>From website placements to social campaigns and community-focused promotions, we can help you choose an advertising option that fits your audience and campaign.</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/advertise-media-kit">Start your advertising journey</Link>
          <a className={styles.secondary} href="mailto:Sandy@WebfitNews.co.nz?subject=Advertising%20with%20Webfit%20News">Email advertising team</a>
        </div>
      </div>
      <div className={styles.contact}>
        <strong>Advertising enquiries</strong>
        <a href="tel:02212999323">02212999323</a>
        <a href="mailto:Sandy@WebfitNews.co.nz">Sandy@WebfitNews.co.nz</a>
      </div>
    </div>
    <div className={styles.stats}>
      {stats.map(([value,label])=><div className={styles.stat} key={label}><b>{value}</b><span>{label}</span></div>)}
    </div>
    <p className={styles.note}>*Google Analytics active users reported for 13 August to 9 September 2026. Social figures are current audience snapshots and may change.</p>
  </section>;
}
