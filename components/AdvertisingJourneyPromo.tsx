import Link from 'next/link';
import { getPublicSiteSettings } from '@/lib/public-settings';
import styles from './AdvertisingJourneyPromo.module.css';

const socialLabels:Record<string,string>={
  facebook:'Facebook',
  instagram:'Instagram',
  youtube:'YouTube',
};

const socialGlyphs:Record<string,string>={
  facebook:'f',
  instagram:'◎',
  youtube:'▶',
};

export async function AdvertisingJourneyPromo(){
  const settings=await getPublicSiteSettings();
  const social=['facebook','instagram','youtube']
    .map(name=>({name,url:settings.social?.[name]}))
    .filter(item=>Boolean(item.url));

  return <section className={styles.wrap} aria-labelledby="advertising-journey-title">
    <div className={styles.socialBlock}>
      <h2>Find us here</h2>
      <div className={styles.socialIcons}>
        {social.map(({name,url})=><a key={name} className={styles.socialIcon} href={url} target="_blank" rel="noopener noreferrer" aria-label={socialLabels[name]} title={socialLabels[name]}>{socialGlyphs[name]}</a>)}
      </div>
      <a className={styles.phone} href="tel:0221299323">☎ <span>022 129 9323</span></a>
    </div>

    <div className={styles.journeyCard}>
      <div className={styles.devices} aria-hidden="true">
        <span className={styles.laptop}>▱</span>
        <span className={styles.tablet}>▯</span>
        <span className={styles.mobile}>▯</span>
      </div>
      <div className={styles.journeyCopy}>
        <h2 id="advertising-journey-title">Start your advertising journey</h2>
        <p>All information about our advertising solutions is available here.</p>
        <Link className={styles.cta} href="/advertise-media-kit">Specifications, rates & deadlines</Link>
      </div>
    </div>
  </section>;
}
