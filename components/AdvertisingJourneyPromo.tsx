import Link from 'next/link';
import { getPublicSiteSettings } from '@/lib/public-settings';
import styles from './AdvertisingJourneyPromo.module.css';

const socialOrder=['facebook','instagram','youtube','linkedin','tiktok'];
const socialLabels:Record<string,string>={facebook:'Facebook',instagram:'Instagram',youtube:'YouTube',linkedin:'LinkedIn',tiktok:'TikTok'};

function SocialIcon({name}:{name:string}){
  if(name==='facebook') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5H17V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.5V13h2.8v8h3.4Z" fill="currentColor"/></svg>;
  if(name==='instagram') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.8" r="1.2" fill="currentColor"/></svg>;
  if(name==='youtube') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8.2c-.2-1.2-1.1-2.1-2.3-2.3C16.9 5.5 12 5.5 12 5.5s-4.9 0-6.7.4C4.1 6.1 3.2 7 3 8.2 2.6 10 2.6 12 2.6 12s0 2 .4 3.8c.2 1.2 1.1 2.1 2.3 2.3 1.8.4 6.7.4 6.7.4s4.9 0 6.7-.4c1.2-.2 2.1-1.1 2.3-2.3.4-1.8.4-3.8.4-3.8s0-2-.4-3.8Z" fill="currentColor"/><path d="m10 15.2 5.2-3.2L10 8.8v6.4Z" fill="#fff"/></svg>;
  if(name==='linkedin') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8.1H3.7V21h2.8V8.1ZM5.1 3a1.7 1.7 0 1 0 0 3.4A1.7 1.7 0 0 0 5.1 3ZM20.5 13.6c0-3.9-2.1-5.8-4.9-5.8-2.3 0-3.3 1.2-3.8 2.1V8.1H9V21h2.8v-6.4c0-1.7.3-3.4 2.5-3.4s2.2 2 2.2 3.5V21h2.8v-7.4Z" fill="currentColor"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.6 3c.4 2.2 1.7 3.6 3.8 4.1v3.1c-1.4 0-2.7-.4-3.8-1.1v5.8a6.1 6.1 0 1 1-5.2-6v3.1a3 3 0 1 0 2.1 2.9V3h3.1Z" fill="currentColor"/></svg>;
}

function DevicesGraphic(){
  return <svg className={styles.devices} viewBox="0 0 280 150" role="img" aria-label="Advertising across desktop, tablet and mobile devices">
    <rect x="28" y="22" width="160" height="94" rx="5" fill="none" stroke="currentColor" strokeWidth="6"/>
    <path d="M92 128h32m-16-12v12" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
    <rect x="170" y="48" width="74" height="88" rx="6" fill="#fff" stroke="currentColor" strokeWidth="6"/>
    <rect x="218" y="73" width="38" height="69" rx="6" fill="#fff" stroke="currentColor" strokeWidth="6"/>
    <rect x="44" y="38" width="128" height="62" rx="2" fill="currentColor" opacity=".08"/>
  </svg>;
}

export async function AdvertisingJourneyPromo(){
  const settings=await getPublicSiteSettings();
  const socials=socialOrder.map(name=>({name,url:settings.social?.[name]})).filter(item=>Boolean(item.url));

  return <section className={styles.wrap} aria-labelledby="advertising-journey-title">
    <div className={styles.findUs}>
      <div>
        <p className={styles.sectionLabel}>Find us here</p>
        <div className={styles.socials}>
          {socials.map(({name,url})=><a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={socialLabels[name]} title={socialLabels[name]}><SocialIcon name={name}/></a>)}
        </div>
      </div>
      <div className={styles.contact}>
        <a href="tel:0221299323">022 129 9323</a>
        <a href="mailto:Sandy@WebfitNews.co.nz">Sandy@WebfitNews.co.nz</a>
      </div>
    </div>

    <div className={styles.adJourney}>
      <div className={styles.visual}><DevicesGraphic/></div>
      <div className={styles.copyBlock}>
        <p className={styles.eyebrow}>Advertise with Webfit News</p>
        <h2 id="advertising-journey-title" className={styles.title}>Start your advertising journey</h2>
        <p className={styles.copy}>All information about our advertising solutions is available here.</p>
        <Link className={styles.primary} href="/advertise-media-kit">Specifications, rates & deadlines</Link>
      </div>
    </div>
  </section>;
}
