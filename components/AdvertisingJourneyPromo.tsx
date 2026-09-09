import Link from 'next/link';
import { getPublicSiteSettings } from '@/lib/public-settings';
import styles from './AdvertisingJourneyPromo.module.css';

const socialLabels:Record<string,string>={
  facebook:'Facebook',
  instagram:'Instagram',
  youtube:'YouTube',
};

export async function AdvertisingJourneyPromo(){
  const settings=await getPublicSiteSettings();
  const social=['facebook','instagram','youtube']
    .map(name=>({name,url:settings.social?.[name]}))
    .filter(item=>Boolean(item.url));

  return <section className={styles.wrap} aria-labelledby="advertising-journey-title">
    <div className={styles.findUs}>
      <div>
        <h2>Find us here</h2>
        <div className={styles.socialIcons}>
          {social.map(({name,url})=><a key={name} className={styles.socialIcon} href={url} target="_blank" rel="noopener noreferrer" aria-label={socialLabels[name]} title={socialLabels[name]}>{name==='facebook'?'f':name==='instagram'?'◎':'▶'}</a>)}
        </div>
      </div>
      <div className={styles.contactLines}>
        <a href="tel:0221299323">☎ <span>022 129 9323</span></a>
        <a href="mailto:Sandy@WebfitNews.co.nz">✉ <span>Sandy@WebfitNews.co.nz</span></a>
      </div>
    </div>

    <div className={styles.journeyCard}>
      <div className={styles.deviceArtwork} aria-hidden="true">
        <div className={styles.laptop}>
          <div className={styles.laptopScreen}>
            <span/><span/><span/>
          </div>
          <div className={styles.laptopBase}/>
        </div>
        <div className={styles.tablet}>
          <div className={styles.tabletScreen}><span/><span/></div>
        </div>
        <div className={styles.phoneDevice}>
          <div className={styles.phoneScreen}><span/><span/><span/></div>
        </div>
      </div>

      <div className={styles.journeyCopy}>
        <h2 id="advertising-journey-title">Start your advertising journey</h2>
        <p>All information about our advertising solutions is available here.</p>
        <Link className={styles.cta} href="/advertise-media-kit">Specifications, rates & deadlines</Link>
      </div>
    </div>
  </section>;
}
